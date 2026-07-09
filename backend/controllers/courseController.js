const Course = require("../models/Course");
const User = require("../models/User");

// ===================================================
// POST /api/courses
// ===================================================
// Protected: Admin / Instructor
// Create a new course.
const createCourse = async (req, res) => {
  try {
    const { title, credits, description, instructorId, courseCode } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Course title is required" });
    }

    const course = await Course.create({
      title,
      courseCode: courseCode || "",
      credits: credits || 3,
      description: description || "",
      instructor: req.user.role === "Admin" && instructorId ? instructorId : req.user._id,
      students: [],
      announcements: []
    });

    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    console.error("Create Course Error:", error.message);
    res.status(500).json({ message: "Server error creating course" });
  }
};

// ===================================================
// GET /api/courses/:id
// ===================================================
// Protected: All roles
// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate("students", "name email enrollmentId");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Optional: check if student is enrolled or user is instructor/admin
    // (We'll assume middleware or frontend handles visibility logic for now)

    res.status(200).json(course);
  } catch (error) {
    console.error("Get Course By ID Error:", error.message);
    res.status(500).json({ message: "Server error fetching course" });
  }
};

// ===================================================
// GET /api/courses
// ===================================================
// Protected: All roles
// Get courses based on role:
// - Student: Gets enrolled courses
// - Instructor: Gets taught courses
// - Admin: Gets all courses
const getCourses = async (req, res) => {
  try {
    let courses;

    if (req.user.role === "Student") {
      courses = await Course.find({ students: req.user._id }).populate("instructor", "name email");
    } else if (req.user.role === "Instructor") {
      courses = await Course.find({ instructor: req.user._id }).populate("students", "name email");
    } else {
      courses = await Course.find().populate("instructor", "name").populate("students", "name");
    }

    res.status(200).json(courses);
  } catch (error) {
    console.error("Get Courses Error:", error.message);
    res.status(500).json({ message: "Server error fetching courses" });
  }
};

// ===================================================
// GET /api/courses/all
// ===================================================
// Protected: Admin / Instructor
// Get all available courses (useful for enrolling students)
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.status(200).json(courses);
  } catch (error) {
    console.error("Get All Courses Error:", error.message);
    res.status(500).json({ message: "Server error fetching all courses" });
  }
};

// ===================================================
// PUT /api/courses/:id/enroll
// ===================================================
// Protected: Admin / Instructor
// Enroll a student in a course
const enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const courseId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.students.includes(studentId)) {
      return res.status(400).json({ message: "Student is already enrolled in this course" });
    }

    course.students.push(studentId);
    await course.save();

    res.status(200).json({ message: "Student enrolled successfully", course });
  } catch (error) {
    console.error("Enroll Error:", error.message);
    res.status(500).json({ message: "Server error enrolling student" });
  }
};

// ===================================================
// PUT /api/courses/:id
// ===================================================
// Protected: Admin only
// Update a course's details
const updateCourse = async (req, res) => {
  try {
    const { title, courseCode, credits, description, instructorId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (title) course.title = title;
    if (courseCode !== undefined) course.courseCode = courseCode;
    if (credits !== undefined) course.credits = credits;
    if (description !== undefined) course.description = description;
    if (instructorId) course.instructor = instructorId;

    await course.save();
    const updated = await Course.findById(course._id).populate("instructor", "name email").populate("students", "name");
    res.status(200).json({ message: "Course updated successfully", course: updated });
  } catch (error) {
    console.error("Update Course Error:", error.message);
    res.status(500).json({ message: "Server error updating course" });
  }
};

// ===================================================
// DELETE /api/courses/:id
// ===================================================
// Protected: Admin only
// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete Course Error:", error.message);
    res.status(500).json({ message: "Server error deleting course" });
  }
};

module.exports = { createCourse, getCourseById, getCourses, getAllCourses, enrollStudent, updateCourse, deleteCourse };

