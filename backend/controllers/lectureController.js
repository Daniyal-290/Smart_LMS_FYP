const Lecture = require("../models/Lecture");
const Course = require("../models/Course");

// ===================================================
// POST /api/lectures
// ===================================================
// Protected: Instructor only
const uploadLecture = async (req, res) => {
  try {
    const { title, courseId } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ message: "Please provide a title and courseId" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    // Ensure the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the user is the instructor of the course
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to upload lectures to this course" });
    }

    const lecture = await Lecture.create({
      title,
      course: courseId,
      uploader: req.user._id,
      fileUrl: `/uploads/${req.file.filename}`,
      originalFileName: req.file.originalname,
    });

    res.status(201).json({
      message: "Lecture uploaded successfully",
      lecture,
    });
  } catch (error) {
    console.error("Lecture upload error:", error.message);
    res.status(500).json({ message: "Server error during lecture upload" });
  }
};

// ===================================================
// GET /api/lectures/course/:courseId
// ===================================================
// Protected: Students and Instructors
const getCourseLectures = async (req, res) => {
  try {
    const { courseId } = req.params;

    const lectures = await Lecture.find({ course: courseId }).sort("-createdAt");
    
    res.status(200).json(lectures);
  } catch (error) {
    console.error("Get Course Lectures Error:", error.message);
    res.status(500).json({ message: "Server error fetching lectures" });
  }
};

module.exports = { uploadLecture, getCourseLectures };
