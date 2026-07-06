const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Submission = require("../models/Submission");

// ===================================================
// POST /api/assignments
// ===================================================
// Protected: Instructor
// Create a new assignment for a course.
const createAssignment = async (req, res) => {
  try {
    const { courseId, title, prompt, dueDate, totalPoints } = req.body;

    if (!courseId || !title || !prompt || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify course exists and instructor teaches it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Only instructor or admin can create an assignment for a course
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Not authorized to create assignment for this course" });
    }

    const assignmentData = {
      course: courseId,
      title,
      prompt,
      dueDate,
      totalPoints: totalPoints || 100,
      rubric: { criteria: [] } // Skipping AI rubric logic
    };

    if (req.file) {
      // Create a relative URL for the frontend to download
      assignmentData.attachmentUrl = `/uploads/${req.file.filename}`;
      assignmentData.originalFileName = req.file.originalname;
    }

    const assignment = await Assignment.create(assignmentData);

    res.status(201).json({ message: "Assignment created successfully", assignment });
  } catch (error) {
    console.error("Create Assignment Error:", error.message);
    res.status(500).json({ message: "Server error creating assignment" });
  }
};

// ===================================================
// GET /api/assignments
// ===================================================
// Protected: Student
// Get assignments for courses the student is enrolled in.
const getAssignments = async (req, res) => {
  try {
    if (req.user.role !== "Student") {
        return res.status(403).json({ message: "Only students can view their combined assignment feed" });
    }

    // Find courses the student is enrolled in
    const courses = await Course.find({ students: req.user._id });
    const courseIds = courses.map(c => c._id);

    // Find assignments for these courses
    const assignments = await Assignment.find({ course: { $in: courseIds } })
                                        .populate("course", "title instructor")
                                        .populate({
                                            path: "course",
                                            populate: { path: "instructor", select: "name" }
                                        })
                                        .sort({ dueDate: 1 });

    // Also fetch submissions to mark status as Pending/Submitted
    const submissions = await Submission.find({ student: req.user._id });
    const submittedIds = submissions.map(s => s.assignment.toString());

    // Map over assignments to inject status
    const assignmentsWithStatus = assignments.map(a => {
        const isSubmitted = submittedIds.includes(a._id.toString());
        const isLate = new Date(a.dueDate) < new Date() && !isSubmitted;
        return {
            ...a.toObject(),
            status: isSubmitted ? "Submitted" : (isLate ? "Late" : "Pending")
        };
    });

    res.status(200).json(assignmentsWithStatus);
  } catch (error) {
    console.error("Get Assignments Error:", error.message);
    res.status(500).json({ message: "Server error fetching assignments" });
  }
};

// ===================================================
// GET /api/assignments/course/:courseId
// ===================================================
// Protected: All roles
// Get assignments for a specific course
const getCourseAssignments = async (req, res) => {
    try {
      const assignments = await Assignment.find({ course: req.params.courseId }).sort({ dueDate: 1 });
      res.status(200).json(assignments);
    } catch (error) {
      console.error("Get Course Assignments Error:", error.message);
      res.status(500).json({ message: "Server error fetching course assignments" });
    }
  };

module.exports = { createAssignment, getAssignments, getCourseAssignments };
