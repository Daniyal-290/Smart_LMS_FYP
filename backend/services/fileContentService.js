const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

// ===================================================
// fileContentService
// ===================================================
// Turns a file stored under /backend/uploads (referenced by
// its DB `fileUrl`, e.g. "/uploads/12345-photo.jpg") into one
// or more Gemini "parts" — the format the Gemini API expects
// inside `contents`.
//
// Supported today:
//   - Images (jpg/jpeg/png/webp)  -> inlineData (Gemini vision reads
//                                    handwritten text/math directly,
//                                    no separate OCR step needed)
//   - PDFs                        -> inlineData (Gemini reads PDFs natively)
//   - Word docs (.docx)           -> extracted as plain text via mammoth
//   - Code/text files             -> read as plain text
//     (.js .ts .py .java .c .cpp .cs .txt .md .json .html .css)
//
// Not supported yet (will throw a clear error instead of failing silently):
//   - .pptx, .mp4, and other binary/office formats not listed above.

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
 * Converts a stored submission/rubric/assignment file into Gemini content parts.
 * Returns an array of parts, e.g. [{ inlineData: {...} }] or [{ text: "..." }]
 */
async function fileToGeminiParts(fileUrl, originalFileName = "") {
  const absolutePath = resolveUploadPath(fileUrl);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found on disk: ${absolutePath}`);
  }

  const ext = path.extname(originalFileName || fileUrl).toLowerCase();

  if (IMAGE_MIME_BY_EXT[ext]) {
    const data = fs.readFileSync(absolutePath).toString("base64");
    return [{ inlineData: { mimeType: IMAGE_MIME_BY_EXT[ext], data } }];
  }

  if (ext === ".pdf") {
    const data = fs.readFileSync(absolutePath).toString("base64");
    return [{ inlineData: { mimeType: "application/pdf", data } }];
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: absolutePath });
    return [{ text: result.value }];
  }

  if (ext === ".pptx" || ext === ".ppt") {
    // Attempt 1: officeparser (v7+)
    try {
      const { OfficeParser, parseOffice } = require("officeparser");
      const fn = (OfficeParser && typeof OfficeParser.parseOffice === "function") ? OfficeParser.parseOffice : parseOffice;
      if (fn) {
        const ast = await fn(absolutePath);
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
      const fileBuffer = fs.readFileSync(absolutePath);
      const unzippedFiles = fflate.unzipSync(fileBuffer);
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
    const content = fs.readFileSync(absolutePath, "utf-8");
    return [{ text: content }];
  }

  throw new Error(
    `Unsupported file type "${ext}" for AI processing. Supported: Images, PDF, .docx, .pptx, .ppt, and common code/text files.`
  );
}

module.exports = { fileToGeminiParts, resolveUploadPath };
