const mongoose = require("mongoose");

// ===================================================
// PracticeQuiz Model
// ===================================================
// Stores AI-generated practice quizzes created for a lecture.
// Non-graded: purely for self-assessment and practice.

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [array => array.length === 4, "Must have exactly 4 options"],
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  explanation: {
    type: String,
    default: "",
  },
});

const practiceQuizSchema = new mongoose.Schema(
  {
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      unique: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    questions: [questionSchema],
    status: {
      type: String,
      enum: ["pending", "ready", "failed"],
      default: "pending",
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PracticeQuiz", practiceQuizSchema);
