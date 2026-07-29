const mongoose = require("mongoose");

// ===================================================
// GradingJob
// ===================================================
// Represents one "Autograde" click for one assignment.
// Created immediately (status "queued"), then updated live as
// the background runner works through submissions, so the
// frontend can poll GET /api/grading/jobs/:jobId for progress.

const gradingJobSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    status: {
      type: String,
      enum: ["queued", "in_progress", "completed", "failed"],
      default: "queued",
    },

    totalCount: { type: Number, default: 0 },
    gradedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },

    // Per-submission failures, so the teacher can see exactly which
    // ones need a manual look / retry via the single regrade endpoint.
    // (Named gradingErrors, not "errors" — that's a reserved field name
    // on Mongoose documents used internally for validation errors.)
    gradingErrors: [
      {
        submission: { type: mongoose.Schema.Types.ObjectId, ref: "Submission" },
        message: String,
      },
    ],

    // Top-level failure — e.g. rubric parsing itself failed, so the
    // job never got to grade any submissions at all.
    failureReason: { type: String, default: "" },

    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("GradingJob", gradingJobSchema);
