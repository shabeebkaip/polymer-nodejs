import fs from "node:fs/promises";
import { extractFromUpload } from "../services/ai/extract.service.js";
import { parseCatalog } from "../services/ai/ai.service.js";
import { resolveReferences } from "../services/ai/refmatch.service.js";
import { createSession, getSession } from "../utils/aiSessionStore.js";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB — B4

export const parseUpload = async (req, res, next) => {
  const file = req.files?.file;
  try {
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded under field name 'file'." });
    }

    // B4 — size guard before reading
    if (file.size > MAX_FILE_BYTES) {
      return res.status(413).json({ success: false, message: "File exceeds 20 MB limit." });
    }

    // B1 — useTempFiles:true leaves file.data empty; read from tempFilePath
    const buffer = await fs.readFile(file.tempFilePath);
    const fileWithData = { name: file.name, mimetype: file.mimetype, data: buffer };

    const extracted = await extractFromUpload(fileWithData);

    if (extracted.isScanned) {
      return res.status(422).json({
        success: false,
        message: "Scanned PDF detected (too little text extracted). Upload a text-based PDF, an Excel/CSV, or an image of the catalog.",
      });
    }

    const aiResult = await parseCatalog({
      text: extracted.text,
      format: extracted.format,
      mimeType: extracted.mimeType,
      imageData: extracted.imageData,
      sourceFile: file.name,
    });

    if (!aiResult.extraction.isPolymerCatalog) {
      return res.status(200).json({
        success: true,
        sessionId: null,
        products: [],
        rejectionReason: aiResult.extraction.rejectionReason || "No polymer data detected in the uploaded file.",
      });
    }

    const productsWithRefs = await Promise.all(
      aiResult.extraction.products.map(async (product) => {
        const refMatches = await resolveReferences(product);
        return { product, refMatches };
      })
    );

    // B3 — store userId so GET can enforce ownership
    const sessionId = await createSession({
      userId: req.user.id.toString(),
      sourceFile: file.name,
      format: extracted.format,
      model: aiResult.model,
      usage: aiResult.usage,
      products: productsWithRefs,
    });

    res.json({
      success: true,
      sessionId,
      sourceFile: file.name,
      format: extracted.format,
      model: aiResult.model,
      products: productsWithRefs,
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

    // B3 — ownership check
    if (session.userId !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { userId, ...publicSession } = session;
    res.json({ success: true, ...publicSession });
  } catch (err) {
    next(err);
  }
};
