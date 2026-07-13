import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { extractText, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";

const execFileAsync = promisify(execFile);

const AVG_CHARS_PER_PAGE_THRESHOLD = 50;
const VISION_PAGE_LIMIT = 25;

// macOS (Homebrew) or Linux (poppler-utils) paths
const PDFTOPPM =
  process.env.PDFTOPPM_PATH ||
  (process.platform === "darwin" ? "/opt/homebrew/bin/pdftoppm" : "pdftoppm");

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Converts every page of a scanned PDF to a 150-DPI JPEG using pdftoppm.
 * Returns an array of Buffers (one per page), sorted by page number.
 */
const pdfPagesToImages = async (buffer) => {
  const tempDir = await mkdtemp(join(tmpdir(), "ph-pdf-"));
  const tempPdf = join(tempDir, "in.pdf");
  try {
    await writeFile(tempPdf, buffer);
    // 100 DPI + scale-to-900: ~50-80KB/page, well under Claude's 2000px multi-image limit
    await execFileAsync(PDFTOPPM, [
      "-r", "100",
      "-scale-to", "900",
      "-jpeg",
      "-jpegopt", "quality=75",
      tempPdf,
      join(tempDir, "pg"),
    ]);
    const files = (await readdir(tempDir))
      .filter((f) => f.endsWith(".jpg"))
      .sort();
    return Promise.all(files.map((f) => readFile(join(tempDir, f))));
  } finally {
    await rm(tempDir, { recursive: true }).catch(() => {});
  }
};

export const extractFromPdf = async (buffer) => {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });

  const trimmed = (text || "").trim();
  const avgCharsPerPage = totalPages > 0 ? trimmed.length / totalPages : 0;

  if (avgCharsPerPage < AVG_CHARS_PER_PAGE_THRESHOLD) {
    if (totalPages > VISION_PAGE_LIMIT) {
      const err = new Error(
        `This document is too large to process (${totalPages} pages). Split it into sections under ${VISION_PAGE_LIMIT} pages.`
      );
      err.status = 422;
      throw err;
    }

    let images;
    try {
      images = await pdfPagesToImages(buffer);
    } catch (convErr) {
      // pdftoppm not available — fall back to native PDF block
      console.warn("pdftoppm unavailable, falling back to native PDF block:", convErr.message);
      return {
        format: "pdf-vision",
        pages: totalPages,
        text: null,
        pdfBuffer: buffer,
        isScanned: true,
        extractionMethod: "vision",
      };
    }

    return {
      format: "pdf-vision-pages",
      pages: totalPages,
      images,
      isScanned: true,
      extractionMethod: "vision",
    };
  }

  return {
    format: "pdf",
    pages: totalPages,
    text: trimmed,
    isScanned: false,
    extractionMethod: "text",
  };
};

export const extractFromSpreadsheet = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return { name, rows };
  });

  const flatText = sheets
    .map((s) => {
      const headerRow = s.rows[0] ? Object.keys(s.rows[0]).join(" | ") : "";
      const body = s.rows
        .map((row) => Object.values(row).join(" | "))
        .join("\n");
      return `## Sheet: ${s.name}\n${headerRow}\n${body}`;
    })
    .join("\n\n");

  return {
    format: "spreadsheet",
    sheets,
    text: flatText,
    extractionMethod: "text",
  };
};

export const extractFromUpload = async (file) => {
  const name = (file.name || "").toLowerCase();
  const mime = file.mimetype || "";

  if (name.endsWith(".pdf") || mime === "application/pdf") {
    return extractFromPdf(file.data);
  }

  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv") ||
    mime.includes("spreadsheet") ||
    mime === "text/csv"
  ) {
    return extractFromSpreadsheet(file.data);
  }

  if (IMAGE_EXTS.some((ext) => name.endsWith(ext)) || IMAGE_MIMES.includes(mime)) {
    return {
      format: "image",
      mimeType: mime || "image/jpeg",
      imageData: file.data,
      text: null,
      isScanned: false,
      extractionMethod: "vision",
    };
  }

  const error = new Error(
    "Unsupported file type. Accepted: PDF, XLSX, XLS, CSV, JPG, PNG, WEBP, GIF."
  );
  error.status = 415;
  throw error;
};
