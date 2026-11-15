const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const { checkSingleSubmissionPlagiarism } = require("../services/plagiarismService");

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
    if (!assignmentId) {
      return res.status(400).json({ message: "Please provide assignmentId" });
    }

    if (!req.file && (!content || !content.trim())) {
      return res.status(400).json({ message: "Please provide either text content or a file attachment." });
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
    // Step 2 — Asynchronously Run Internal Plagiarism Pipeline
    // --------------------------------------------------
    // Performs question stripping, vector embedding, and peer similarity check.
    checkSingleSubmissionPlagiarism(submission._id, assignmentId).catch((err) => {
      console.warn("Background plagiarism check error:", err.message);
    });

    // --------------------------------------------------
    // Step 3 — Return the completed submission
    // --------------------------------------------------
    res.status(201).json({
      message: "Submission created and received successfully",
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
      // Exclude pendingAiGrade/pendingAiFeedback — those are unpublished,
      // teacher-review-only fields and must never reach a student, even
      // via the raw API response.
      .select("-pendingAiGrade -pendingAiFeedback")
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
      .populate({
        path: "assignment",
        select: "title totalPoints prompt description course",
        populate: { path: "course", select: "title courseCode" },
      })
      .populate("plagiarismReport.matchedSubmissions.matchedStudentId", "name email enrollmentId")
      .populate("plagiarismReport.matchedSubmissions.matchedSubmissionId", "cleanedAnswerText content originalFileName");

    res.status(200).json(submissions);
  } catch (error) {
    console.error("Get Course Submissions Error:", error.message);
    res.status(500).json({ message: "Server error fetching submissions" });
  }
};

// ===================================================
// GET /api/submissions/instructor/plagiarism-flags
// ===================================================
// Protected: Instructor / Admin
// Fetch all submissions with plagiarism data across all courses taught by the instructor.
const getInstructorPlagiarismFlags = async (req, res) => {
  try {
    const Course = require("../models/Course");

    // Find courses taught by instructor (or all courses if admin)
    const filter = req.user.role === "Admin" ? {} : { instructor: req.user._id };
    const courses = await Course.find(filter).select("title courseCode");
    const courseIds = courses.map((c) => c._id);

    // Find all assignments in these courses
    const assignments = await Assignment.find({ course: { $in: courseIds } }).select(
      "title totalPoints prompt description course"
    );
    const assignmentIds = assignments.map((a) => a._id);

    // Find submissions for these assignments
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      .populate("student", "name email enrollmentId")
      .populate({
        path: "assignment",
        select: "title totalPoints prompt description course",
        populate: { path: "course", select: "title courseCode" },
      })
      .populate(
        "plagiarismReport.matchedSubmissions.matchedStudentId",
        "name email enrollmentId"
      )
      .populate(
        "plagiarismReport.matchedSubmissions.matchedSubmissionId",
        "cleanedAnswerText content originalFileName"
      )
      .sort({ updatedAt: -1 });

    // Compute stats
    let totalChecked = 0;
    let totalFlags = 0; // >= 50%
    let highRisk = 0; // >= 75%
    let unreviewed = 0;
    let totalScoreSum = 0;

    const formattedList = submissions.map((sub) => {
      const highestScore = Math.round(
        sub.plagiarismReport?.highestSimilarityScore ?? sub.similarityScore ?? 0
      );
      const isChecked = Boolean(
        sub.plagiarismReport?.checkedAt || sub.similarityScore !== undefined
      );

      if (isChecked && sub.plagiarismReport?.checkedAt) {
        totalChecked++;
        totalScoreSum += highestScore;
        if (highestScore >= 50) {
          totalFlags++;
          if (sub.plagiarismStatus === "Unreviewed" || !sub.plagiarismStatus) {
            unreviewed++;
          }
        }
        if (highestScore >= 75) {
          highRisk++;
        }
      }

      const courseInfo = sub.assignment?.course;
      return {
        _id: sub._id,
        student: sub.student,
        assignment: sub.assignment,
        courseTitle: courseInfo?.title || "Unknown Course",
        courseCode: courseInfo?.courseCode || "N/A",
        similarityScore: highestScore,
        isFlagged: sub.isFlagged || highestScore >= 75,
        status: sub.plagiarismStatus || (highestScore >= 50 ? "Unreviewed" : "Cleared"),
        checkedAt: sub.plagiarismReport?.checkedAt || null,
        plagiarismReport: sub.plagiarismReport,
        cleanedAnswerText: sub.cleanedAnswerText,
        content: sub.content,
        fileUrl: sub.fileUrl,
        originalFileName: sub.originalFileName,
      };
    });

    const avgSimilarity =
      totalChecked > 0 ? (totalScoreSum / totalChecked).toFixed(1) : "0.0";

    res.status(200).json({
      stats: {
        totalChecked,
        totalFlags,
        unreviewed,
        highRisk,
        avgSimilarity,
      },
      flags: formattedList,
      courses,
    });
  } catch (error) {
    console.error("Get Instructor Plagiarism Flags Error:", error.message);
    res.status(500).json({ message: "Server error fetching plagiarism flags" });
  }
};

// ===================================================
// PATCH /api/submissions/:id/plagiarism-status
// ===================================================
// Protected: Instructor / Admin
// Updates the review status of a plagiarism flag ("Unreviewed", "Reviewed", "Cleared").
const updatePlagiarismStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Unreviewed", "Reviewed", "Cleared"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.plagiarismStatus = status;
    await submission.save();

    res.status(200).json({
      message: `Status updated to ${status}`,
      submissionId: id,
      status,
    });
  } catch (error) {
    console.error("Update Plagiarism Status Error:", error.message);
    res.status(500).json({ message: "Server error updating plagiarism status" });
  }
};

module.exports = {
  createSubmission,
  getMyGrades,
  getCourseSubmissions,
  getInstructorPlagiarismFlags,
  updatePlagiarismStatus,
};
