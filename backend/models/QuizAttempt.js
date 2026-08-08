const mongoose = require("mongoose");

// ===================================================
// QuizAttempt Model
// ===================================================
// Stores student self-assessment attempts for practice quizzes.
// Does NOT count towards official sessional grades.

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PracticeQuiz",
      required: true,
    },
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    answers: [
      {
        questionIndex: Number,
        selectedOptionIndex: Number,
        isCorrect: Boolean,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
