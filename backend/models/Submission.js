const mongoose = require("mongoose");

// ===================================================
// Submission Schema
// ===================================================
// Represents a single student's submission for an
// assignment. Contains AI-related fields that will be
// populated by the AI teammate's grading pipeline.

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment is required"],
    },

    content: {
      type: String,
      default: "", // Now optional, since they might just upload a file
    },

    fileUrl: {
      type: String, // Path to the uploaded submission file
      default: "",
    },

    originalFileName: {
      type: String, // The original name of the file for display
      default: "",
    },

    // -------------------------------------------------
    // AI-populated fields (filled by grading pipeline)
    // -------------------------------------------------

    aiGrade: {
      type: Number,
      default: null,
    },

    aiFeedback: {
      type: String,
      default: "",
    },

    embedding: {
      type: [Number], // Vector embedding for similarity/plagiarism checks
      default: [],
    },

    isFlagged: {
      type: Boolean,
      default: false,
    },

    similarityScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
