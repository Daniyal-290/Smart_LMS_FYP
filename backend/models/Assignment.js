const mongoose = require("mongoose");

// ===================================================
// Assignment Schema
// ===================================================
// Belongs to a Course. The `rubric` field stores a
// free-form JSON object that the AI grading engine
// will use to evaluate submissions.

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },

    dueDate: {
      type: Date,
    },

    rubric: {
      type: mongoose.Schema.Types.Mixed, // Flexible JSON object
      default: {},
    },

    totalPoints: {
      type: Number,
      required: [true, "Total points is required"],
      default: 100,
    },

    attachmentUrl: {
      type: String, // Path to the uploaded file
      default: "",
    },
    
    originalFileName: {
      type: String, // The original name of the file for display
      default: "",
    },

    // -------------------------------------------------
    // Rubric file (uploaded by teacher at grading time, parsed
    // by Gemini into rubric.criteria above, saved for reuse on
    // future re-grades) — added for the AI grading engine.
    // -------------------------------------------------
    rubricFileUrl: {
      type: String,
      default: "",
    },

    rubricOriginalFileName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
