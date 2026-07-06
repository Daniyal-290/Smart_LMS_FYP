const mongoose = require("mongoose");

// ===================================================
// Course Schema
// ===================================================
// Links an instructor to a list of enrolled students.

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },

    courseCode: {
      type: String,
      trim: true,
    },

    credits: {
      type: Number,
      default: 3,
    },

    description: {
      type: String,
      trim: true,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    announcements: [
      {
        message: { type: String, required: true },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
