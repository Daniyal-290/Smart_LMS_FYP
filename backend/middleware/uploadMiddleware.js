const multer = require("multer");
const UploadedFile = require("../models/UploadedFile");

// Use memory storage to support serverless environments (Vercel read-only filesystem)
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for lecture slides/PDFs
});

/**
 * Checks if a parsed multer file is empty or missing content.
 * Handles HTML forms submitting an empty <input type="file" /> field (0 bytes).
 */
function isFileEmpty(file) {
  if (!file) return true;
  if (!file.originalname || typeof file.originalname !== "string" || !file.originalname.trim()) {
    return true;
  }
  if (!file.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return true;
  }
  if (file.size === 0) {
    return true;
  }
  return false;
}

/**
 * Persists an uploaded file buffer to MongoDB and attaches the generated
 * filename to req.file so downstream controllers and routes remain 100% compatible.
 */
async function persistUploadedFile(file) {
  if (isFileEmpty(file)) {
    return null;
  }

  // Exact same unique filename format previously used by diskStorage
  if (!file.filename) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    file.filename = uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_");
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

// Keep references to multer's original methods before overriding
const originalSingle = upload.single.bind(upload);
const originalArray = upload.array.bind(upload);
const originalFields = upload.fields.bind(upload);

/**
 * Middleware wrapper for single file uploads.
 * Parses file into memory, guards against empty 0-byte submissions,
 * persists valid buffers into MongoDB, and populates req.file.filename.
 */
function single(fieldName) {
  const multerSingle = originalSingle(fieldName);
  return (req, res, next) => {
    multerSingle(req, res, async (err) => {
      if (err) return next(err);

      if (req.file) {
        if (isFileEmpty(req.file)) {
          // Empty or 0-byte file input submitted — treat as no file attached
          req.file = undefined;
        } else {
          try {
            await persistUploadedFile(req.file);
          } catch (dbErr) {
            console.error("Failed to save uploaded file to MongoDB:", dbErr);
            return next(dbErr);
          }
        }
      }

      next();
    });
  };
}

/**
 * Middleware wrapper for array file uploads.
 */
function array(fieldName, maxCount) {
  const multerArray = originalArray(fieldName, maxCount);
  return (req, res, next) => {
    multerArray(req, res, async (err) => {
      if (err) return next(err);

      if (req.files && Array.isArray(req.files)) {
        req.files = req.files.filter((f) => !isFileEmpty(f));
        try {
          for (const f of req.files) {
            await persistUploadedFile(f);
          }
        } catch (dbErr) {
          console.error("Failed to save uploaded files to MongoDB:", dbErr);
          return next(dbErr);
        }
      }

      next();
    });
  };
}

/**
 * Middleware wrapper for fields file uploads.
 */
function fields(fieldsArray) {
  const multerFields = originalFields(fieldsArray);
  return (req, res, next) => {
    multerFields(req, res, async (err) => {
      if (err) return next(err);

      if (req.files && typeof req.files === "object") {
        try {
          for (const key of Object.keys(req.files)) {
            if (Array.isArray(req.files[key])) {
              req.files[key] = req.files[key].filter((f) => !isFileEmpty(f));
              for (const f of req.files[key]) {
                await persistUploadedFile(f);
              }
            }
          }
        } catch (dbErr) {
          console.error("Failed to save uploaded files to MongoDB:", dbErr);
          return next(dbErr);
        }
      }

      next();
    });
  };
}

upload.single = single;
upload.array = array;
upload.fields = fields;
upload.persistUploadedFile = persistUploadedFile;
upload.isFileEmpty = isFileEmpty;

module.exports = upload;
