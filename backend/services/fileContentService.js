const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const UploadedFile = require("../models/UploadedFile");

// ===================================================
// fileContentService
// ===================================================
// Turns a file stored in MongoDB or under /backend/uploads
// (referenced by its DB `fileUrl`, e.g. "/uploads/12345-photo.jpg")
// into one or more Gemini "parts" — the format the Gemini API
// expects inside `contents`.
//
// Supported:
//   - Images (jpg/jpeg/png/webp)  -> inlineData (Gemini vision)
//   - PDFs                        -> inlineData (Gemini PDF)
//   - Word docs (.docx)           -> extracted as plain text via mammoth
//   - PPTX slides                 -> extracted via officeparser / fflate
//   - Code/text files             -> read as plain text
//     (.js .ts .py .java .c .cpp .cs .txt .md .json .html .css)

const IMAGE_MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const TEXT_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".cs",
  ".txt", ".md", ".json", ".html", ".css", ".rb", ".go", ".php",
]);

/**
 * Resolves a DB-stored fileUrl (e.g. "/uploads/xyz.jpg") to an
 * absolute path on disk inside backend/uploads.
 */
function resolveUploadPath(fileUrl) {
  const filename = path.basename(fileUrl);
  return path.join(__dirname, "..", "uploads", filename);
}

/**
 * Retrieves the raw file Buffer, prioritizing MongoDB (UploadedFile) for cloud/Vercel
 * serverless persistence, with a fallback to local disk.
 */
async function getFileBuffer(fileUrl) {
  if (!fileUrl) return null;
  const filename = path.basename(fileUrl);

  // 1. Look up file in MongoDB (Primary cloud/Vercel storage)
  try {
    const fileDoc = await UploadedFile.findOne({ filename });
    if (fileDoc && fileDoc.data) {
      return fileDoc.data;
    }
  } catch (err) {
    console.warn("Could not retrieve file from MongoDB:", err.message);
  }

  // 2. Fallback to local disk (for legacy local development files)
  const absolutePath = resolveUploadPath(fileUrl);
  if (fs.existsSync(absolutePath)) {
    return fs.readFileSync(absolutePath);
  }

  return null;
}

/**
 * Converts a stored submission/rubric/assignment file into Gemini content parts.
 * Returns an array of parts, e.g. [{ inlineData: {...} }] or [{ text: "..." }]
 */
async function fileToGeminiParts(fileUrl, originalFileName = "") {
  const buffer = await getFileBuffer(fileUrl);

  if (!buffer) {
    throw new Error(`File not found in database or on disk: ${fileUrl}`);
  }

  const ext = path.extname(originalFileName || fileUrl).toLowerCase();

  if (IMAGE_MIME_BY_EXT[ext]) {
    const data = buffer.toString("base64");
    return [{ inlineData: { mimeType: IMAGE_MIME_BY_EXT[ext], data } }];
  }

  if (ext === ".pdf") {
    const data = buffer.toString("base64");
    return [{ inlineData: { mimeType: "application/pdf", data } }];
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return [{ text: result.value }];
  }

  if (ext === ".pptx" || ext === ".ppt") {
    // Attempt 1: officeparser (v7+)
    try {
      const { OfficeParser, parseOffice } = require("officeparser");
      const fn = (OfficeParser && typeof OfficeParser.parseOffice === "function") ? OfficeParser.parseOffice : parseOffice;
      if (fn) {
        const ast = await fn(buffer);
        const extractedText = typeof ast === "string" ? ast : (ast && typeof ast.toText === "function" ? ast.toText() : "");
        if (extractedText && extractedText.trim()) {
          return [{ text: extractedText.trim() }];
        }
      }
    } catch (officeErr) {
      console.warn("officeparser extraction warning:", officeErr.message);
    }

    // Attempt 2: Extract directly from XML slides in PPTX zip archive using fflate
    try {
      const fflate = require("officeparser/node_modules/fflate") || require("fflate");
      const unzippedFiles = fflate.unzipSync(buffer);
      const slideTexts = [];

      for (const [filename, fileData] of Object.entries(unzippedFiles)) {
        if (filename.startsWith("ppt/slides/slide") && filename.endsWith(".xml")) {
          const xmlContent = new TextDecoder("utf-8").decode(fileData);
          const matches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
          if (matches) {
            const slideText = matches
              .map((m) => m.replace(/<[^>]+>/g, "").trim())
              .filter(Boolean)
              .join(" ");
            if (slideText) slideTexts.push(slideText);
          }
        }
      }

      if (slideTexts.length > 0) {
        return [{ text: slideTexts.join("\n\n") }];
      }
    } catch (fallbackErr) {
      console.warn("Fallback PPTX extraction warning:", fallbackErr.message);
    }
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    const content = buffer.toString("utf-8");
    return [{ text: content }];
  }

  throw new Error(
    `Unsupported file type "${ext}" for AI processing. Supported: Images, PDF, .docx, .pptx, .ppt, and common code/text files.`
  );
}

module.exports = { fileToGeminiParts, resolveUploadPath, getFileBuffer };
