import { extractText, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";

const PDF_TEXT_THRESHOLD = 100;

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const extractFromPdf = async (buffer) => {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });

  const trimmed = (text || "").trim();
  const isScanned = trimmed.length < PDF_TEXT_THRESHOLD;

  return {
    format: "pdf",
    pages: totalPages,
    text: trimmed,
    isScanned,
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
    };
  }

  const error = new Error(
    "Unsupported file type. Accepted: PDF, XLSX, XLS, CSV, JPG, PNG, WEBP, GIF."
  );
  error.status = 415;
  throw error;
};
