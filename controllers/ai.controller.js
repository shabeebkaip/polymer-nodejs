import fs from "node:fs/promises";
import { extractFromUpload } from "../services/ai/extract.service.js";
import { parseCatalog } from "../services/ai/ai.service.js";
import { resolveReferences } from "../services/ai/refmatch.service.js";
import { createSession, getSession, updateSession } from "../utils/aiSessionStore.js";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

// Fields that get ConfidentNumber wrappers — vision path confidence is downgraded for these
const NUMERIC_FIELDS = new Set([
  "density", "mfi", "tensileStrength", "elongationAtBreak",
  "flexuralModulus", "shoreHardness", "waterAbsorption",
  "minimum_order_quantity", "stock", "price",
]);

const applyConfidenceRules = (product, extractionMethod) => {
  for (const [key, field] of Object.entries(product)) {
    if (!field || typeof field !== "object" || !("value" in field)) continue;

    // Rule 1 — null value implies unknown confidence
    if (field.value === null) {
      field.confidence = "unknown";
    }

    // Rule 2 — vision path numeric downgrade
    if (
      extractionMethod === "vision" &&
      NUMERIC_FIELDS.has(key) &&
      field.confidence === "high"
    ) {
      field.confidence = "medium";
    }

    // Rule 3 — bound-only spec: promote upperBound to value at medium confidence
    if (field.value === null && field.upperBound != null) {
      field.value = field.upperBound;
      field.confidence = "medium";
    }
  }
  return product;
};

// Runs the heavy pipeline in the background and streams status into the session store.
// Never throws — all errors get written into the session as { status: "failed", ... }.
const runPipeline = async (sessionId, fileWithData, userId) => {
  try {
    const extracted = await extractFromUpload(fileWithData);
    const extractionMethod = extracted.extractionMethod;

    const aiResult = await parseCatalog({
      text: extracted.text,
      format: extracted.format,
      mimeType: extracted.mimeType,
      imageData: extracted.imageData,
      pdfBuffer: extracted.pdfBuffer,
      images: extracted.images,
      sourceFile: fileWithData.name,
    });

    if (!aiResult.extraction.isPolymerCatalog) {
      await updateSession(sessionId, {
        status: "completed",
        extractionMethod,
        ocrFailed: false,
        products: [],
        rejectionReason: aiResult.extraction.rejectionReason || "No polymer data detected in the uploaded file.",
      });
      return;
    }

    const productsWithRefs = await Promise.all(
      aiResult.extraction.products.map(async (product) => {
        applyConfidenceRules(product, extractionMethod);
        const refMatches = await resolveReferences(product);
        return { product, refMatches };
      })
    );

    const ocrFailed = extractionMethod === "vision" && aiResult.extraction.products.length === 0;

    await updateSession(sessionId, {
      status: "completed",
      format: extracted.format,
      extractionMethod,
      ocrFailed,
      model: aiResult.model,
      usage: aiResult.usage,
      products: productsWithRefs,
    });
  } catch (err) {
    console.error(`[ai.parse] pipeline failed for session ${sessionId}:`, err);
    await updateSession(sessionId, {
      status: "failed",
      failureCode: err.name === "TimeoutError" ? "timeout" : "error",
      errorMessage: err.message || "Processing failed.",
    }).catch(() => {});
  }
};

export const parseUpload = async (req, res, next) => {
  const file = req.files?.file;
  try {
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded under field name 'file'." });
    }

    if (file.size > MAX_FILE_BYTES) {
      return res.status(413).json({ success: false, message: "File exceeds 20 MB limit." });
    }

    // Load the buffer now so we can clean up the temp file before returning.
    const buffer = await fs.readFile(file.tempFilePath);
    const fileWithData = { name: file.name, mimetype: file.mimetype, data: buffer };
    const userId = req.user.id.toString();

    const sessionId = await createSession({
      userId,
      sourceFile: file.name,
      status: "processing",
    });

    // Fire-and-forget — no HTTP timeout pressure.
    setImmediate(() => runPipeline(sessionId, fileWithData, userId));

    return res.status(202).json({
      success: true,
      sessionId,
      status: "processing",
    });
  } catch (err) {
    next(err);
  } finally {
    if (file?.tempFilePath) {
      await fs.unlink(file.tempFilePath).catch(() => {});
    }
  }
};

export const getParseSession = async (req, res, next) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found or expired." });
    }

    if (session.userId !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { userId, ...publicSession } = session;
    res.json({ success: true, sessionId: req.params.id, ...publicSession });
  } catch (err) {
    next(err);
  }
};
