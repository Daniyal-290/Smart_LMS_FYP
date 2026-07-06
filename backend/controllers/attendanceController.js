const Attendance = require("../models/Attendance");
const Course = require("../models/Course");

// ===================================================
// POST /api/attendance
// ===================================================
// Protected: Instructor / Admin
// Record attendance for a specific lecture.
const recordAttendance = async (req, res) => {
  try {
    const { courseId, lectureDate, lectureNo, duration, mode, topic, records } = req.body;

    if (!courseId || !lectureDate || !records) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to record attendance for this course" });
    }

    const attendance = await Attendance.create({
      course: courseId,
      lectureDate,
      lectureNo,
      duration,
      mode,
      topic,
      records
    });

    res.status(201).json({ message: "Attendance recorded successfully", attendance });
  } catch (error) {
    console.error("Record Attendance Error:", error.message);
    res.status(500).json({ message: "Server error recording attendance" });
  }
};

module.exports = { recordAttendance };
