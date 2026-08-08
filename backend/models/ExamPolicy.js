const mongoose = require("mongoose");

// ===================================================
// ExamPolicy Model — Singleton
// ===================================================
// Stores university-wide exam configuration.
// Only one document exists — created/updated by Admin.

const examPolicySchema = new mongoose.Schema(
  {
    midtermTotalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    finalsTotalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamPolicy", examPolicySchema);
