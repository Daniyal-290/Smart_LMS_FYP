const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

// ===================================================
// POST /api/submissions
// ===================================================
// Protected: Students only.
//
// Flow:
//   1. Receive assignmentId + content from the body.
//   2. Save the initial submission to MongoDB.
//   3. [PLACEHOLDER] — AI teammate injects grading here.
//   4. Simulate AI result with mock data.
//   5. Return the completed submission.

const createSubmission = async (req, res) => {
  try {
    const { assignmentId, content } = req.body;

    // --- Validation ---
    if (!assignmentId || !content) {
      return res
        .status(400)
        .json({ message: "Please provide assignmentId and content" });
    }

    // --------------------------------------------------
    // Step 1 — Validate & Check Constraints
    // --------------------------------------------------
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Enforce Due Date
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ message: "The due date for this assignment has passed." });
    }

    // Prevent Duplicate Submissions
    const existingSubmission = await Submission.findOne({
      student: req.user._id,
      assignment: assignmentId,
    });
    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this assignment." });
    }

    // --------------------------------------------------
    // Step 2 — Save the initial submission
    // --------------------------------------------------
    const submissionData = {
      student: req.user._id,
      assignment: assignmentId,
      content: content || "",
    };

    if (req.file) {
      submissionData.fileUrl = `/uploads/${req.file.filename}`;
      submissionData.originalFileName = req.file.originalname;
    }

    const submission = await Submission.create(submissionData);

    // ==================================================
    // ⚠️  TEAMMATE: CALL GEMINI AUTO-GRADING AND
    //     VECTOR EMBEDDINGS HERE
    // ==================================================
    //
    // This is the integration point for the AI pipeline.
    // Expected tasks at this step:
    //
    //   a) Generate a vector embedding from `content`
    //      and store it in `submission.embedding`.
    //
    //   b) Call the Gemini API with the submission
    //      `content` + the assignment `rubric` to
    //      produce an AI grade and feedback.
    //
    //   c) Run a vector similarity search against other
    //      submissions for plagiarism detection and
    //      update `submission.similarityScore` and
    //      `submission.isFlagged`.
    //
    // Replace the mock values below with real AI results.
    // ==================================================

    // --------------------------------------------------
    // Step 2 — Simulate AI grading (MOCK — replace later)
    // --------------------------------------------------
    submission.aiGrade = null; // Disabled mock grading
    submission.aiFeedback = ""; // Disabled mock feedback
    submission.isFlagged = false;
    submission.similarityScore = 0;
    submission.embedding = []; // Placeholder — will be a real vector

    await submission.save();

    // --------------------------------------------------
    // Step 3 — Return the completed submission
    // --------------------------------------------------
    res.status(201).json({
      message: "Submission created and graded successfully",
      submission,
    });
  } catch (error) {
    console.error("Submission error:", error.message);
    res.status(500).json({ message: "Server error during submission" });
  }
};

// ===================================================
// GET /api/submissions/me
// ===================================================
// Protected: Students only
// Fetch all submissions for the logged-in student to display grades.
const getMyGrades = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate({
        path: "assignment",
        select: "title course dueDate totalPoints",
        populate: { path: "course", select: "title" }
      });
    res.status(200).json(submissions);
  } catch (error) {
    console.error("Get Grades Error:", error.message);
    res.status(500).json({ message: "Server error fetching grades" });
  }
};

// ===================================================
// GET /api/submissions/course/:courseId
// ===================================================
// Protected: Instructor / Admin
// Fetch all submissions for a specific course to grade them.
const getCourseSubmissions = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // First, find all assignments in this course
    const assignments = await Assignment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);

    // Then find submissions for these assignments
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      .populate("student", "name email enrollmentId")
      .populate("assignment", "title totalPoints");

    res.status(200).json(submissions);
  } catch (error) {
    console.error("Get Course Submissions Error:", error.message);
    res.status(500).json({ message: "Server error fetching submissions" });
  }
};

module.exports = { createSubmission, getMyGrades, getCourseSubmissions };
