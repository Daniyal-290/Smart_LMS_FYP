const multer = require("multer");
const UploadedFile = require("../models/UploadedFile");

// Use memory storage to support serverless environments (Vercel read-only filesystem)
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for lecture slides/PDFs
});

/**
 * Persists an uploaded file buffer to MongoDB and attaches the generated
 * filename to req.file so downstream controllers and routes remain 100% compatible.
 */
async function persistUploadedFile(file) {
  if (!file || !file.buffer) return null;

  // Exact same unique filename format previously used by diskStorage
  if (!file.filename) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    file.filename = uniqueSuffix + "-" + (file.originalname || "file").replace(/\s+/g, "_");
  }

  file.path = `/uploads/${file.filename}`;

  await UploadedFile.create({
    filename: file.filename,
    originalName: file.originalname || "unknown",
    mimetype: file.mimetype || "application/octet-stream",
    size: file.size || file.buffer.length,
    data: file.buffer,
  });

  return file;
}

// Keep reference to multer's original single method before overriding
const originalSingle = upload.single.bind(upload);

/**
 * Middleware wrapper for single file uploads.
 * Parses file into memory, persists buffer into MongoDB, and populates req.file.filename.
 */
function single(fieldName) {
  const multerSingle = originalSingle(fieldName);
  return (req, res, next) => {
    multerSingle(req, res, async (err) => {
      if (err) return next(err);
      if (req.file) {
        try {
          await persistUploadedFile(req.file);
        } catch (dbErr) {
          console.error("Failed to save uploaded file to MongoDB:", dbErr);
          return next(dbErr);
        }
      }
      next();
    });
  };
}

upload.single = single;
upload.persistUploadedFile = persistUploadedFile;

module.exports = upload;
