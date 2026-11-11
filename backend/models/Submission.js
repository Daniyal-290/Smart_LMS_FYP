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
    // AI-populated fields — FINAL, PUBLISHED grade/feedback.
    // Only written by an explicit teacher "Publish" action —
    // this is what a student can see.
    // -------------------------------------------------

    aiGrade: {
      type: Number,
      default: null,
    },

    aiFeedback: {
      type: String,
      default: "",
    },

    // -------------------------------------------------
    // Draft AI grade/feedback — written directly by the grading
    // engine, visible only to the teacher for review. Copied into
    // aiGrade/aiFeedback above only when the teacher publishes it.
    // -------------------------------------------------

    pendingAiGrade: {
      type: Number,
      default: null,
    },

    pendingAiFeedback: {
      type: String,
      default: "",
    },

    // -------------------------------------------------
    // Internal Plagiarism Detection fields
    // -------------------------------------------------

    cleanedAnswerText: {
      type: String,
      default: "", // Student's submission with assignment questions, headers & boilerplate removed
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

    plagiarismReport: {
      isFlagged: {
        type: Boolean,
        default: false,
      },
      highestSimilarityScore: {
        type: Number,
        default: 0, // 0 to 100 percentage
      },
      checkedAt: {
        type: Date,
      },
      matchedSubmissions: [
        {
          matchedStudentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          matchedSubmissionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Submission",
          },
          cosineSimilarity: {
            type: Number,
            default: 0,
          },
          aiVerifiedScore: {
            type: Number,
            default: 0,
          },
          reasoning: {
            type: String,
            default: "",
          },
          flaggedType: {
            type: String,
            enum: ["Direct Copy", "Paraphrased", "Identical Math Errors/Steps", "Safe"],
            default: "Safe",
          },
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
