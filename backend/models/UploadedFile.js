const mongoose = require("mongoose");

// ===================================================
// UploadedFile Schema (MongoDB File Storage)
// ===================================================
// Stores uploaded files (PDFs, PPTX, images, docs) directly in MongoDB
// as Buffers to support serverless environments (such as Vercel)
// where the local filesystem is read-only (EROFS).

const uploadedFileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimetype: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UploadedFile", uploadedFileSchema);
