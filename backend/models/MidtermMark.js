const mongoose = require("mongoose");

// ===================================================
// MidtermMark Model
// ===================================================
// Stores per-student, per-course midterm marks entered
// by the instructor.

const midtermMarkSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Prevent duplicate entries — one mark per student per course
midtermMarkSchema.index({ course: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("MidtermMark", midtermMarkSchema);
