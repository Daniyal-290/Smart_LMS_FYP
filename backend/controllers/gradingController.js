const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const GradingJob = require("../models/GradingJob");
const Course = require("../models/Course");
const { startAutogradeJob } = require("../services/gradingJobRunner");
const { gradeSubmission } = require("../services/gradingService");

// ===================================================
// Shared helper — only the course's instructor or an Admin
// may manage grading for an assignment.
// ===================================================
async function assertCanManageAssignment(assignment, user) {
  const course = await Course.findById(assignment.course);
  if (!course) {
    throw { status: 404, message: "Course not found for this assignment" };
  }
  if (course.instructor.toString() !== user._id.toString() && user.role !== "Admin") {
    throw { status: 403, message: "Not authorized to manage this assignment" };
  }
}

function formatFeedback(result) {
  const lines = result.criteriaBreakdown.map(
    (c) => `• ${c.criterion} (${c.score}/${c.maxScore}): ${c.feedback}`
  );
  return `${lines.join("\n")}\n\nOverall: ${result.overallFeedback}`;
}

// ===================================================
// POST /api/grading/assignments/:assignmentId/autograde
// ===================================================
// Protected: Instructor (owner) / Admin
// Teacher uploads a rubric file. Starts a background job that grades
// every ungraded submission as a DRAFT (pendingAiGrade/pendingAiFeedback).
// Nothing is visible to students until explicitly published.
const autogradeAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const regrade = req.query.regrade === "true";

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a rubric file" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await assertCanManageAssignment(assignment, req.user);

    const rubricFile = {
      fileUrl: `/uploads/${req.file.filename}`,
      originalFileName: req.file.originalname,
    };

    const job = await startAutogradeJob(assignment, rubricFile, regrade);

    res.status(202).json({
      message: `Grading job started for ${job.totalCount} submission(s). Review and publish once complete.`,
      jobId: job._id,
      totalCount: job.totalCount,
      status: job.status,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("Autograde Assignment Error:", error.message || error);
    res.status(status).json({ message: error.message || "Server error starting grading job" });
  }
};

// ===================================================
// GET /api/grading/jobs/:jobId
// ===================================================
// Protected: Instructor (owner) / Admin
const getJobStatus = async (req, res) => {
  try {
    const job = await GradingJob.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: "Grading job not found" });
    }

    const assignment = await Assignment.findById(job.assignment);
    if (assignment) {
      await assertCanManageAssignment(assignment, req.user);
    }

    res.status(200).json({
      jobId: job._id,
      status: job.status,
      totalCount: job.totalCount,
      gradedCount: job.gradedCount,
      failedCount: job.failedCount,
      errors: job.gradingErrors,
      failureReason: job.failureReason,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("Get Job Status Error:", error.message || error);
    res.status(status).json({ message: error.message || "Server error fetching job status" });
  }
};

// ===================================================
// POST /api/grading/submissions/:id/grade
// ===================================================
// Protected: Instructor (owner) / Admin
// Grades (or re-grades) a single submission as a DRAFT. Requires the
// assignment to already have a saved rubric (i.e. autograde has run
// at least once for this assignment).
const regradeSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found for this submission" });
    }

    await assertCanManageAssignment(assignment, req.user);

    if (!assignment.rubric?.criteria?.length) {
      return res.status(400).json({
        message: "This assignment has no saved rubric yet. Run Autograde at least once first.",
      });
    }

    const result = await gradeSubmission(submission, assignment);

    submission.pendingAiGrade = result.totalScore;
    submission.pendingAiFeedback = formatFeedback(result);
    await submission.save();

    res.status(200).json({ message: "Graded — review and publish when ready.", submission });
  } catch (error) {
    const status = error.status || 500;
    console.error("Regrade Submission Error:", error.message || error);
    res.status(status).json({ message: error.message || "Server error during grading" });
  }
};

// ===================================================
// POST /api/grading/submissions/:id/publish
// ===================================================
// Protected: Instructor (owner) / Admin
// Copies the draft grade/feedback into the final, student-visible fields.
const publishSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found for this submission" });
    }

    await assertCanManageAssignment(assignment, req.user);

    if (submission.pendingAiGrade === null || submission.pendingAiGrade === undefined) {
      return res.status(400).json({ message: "No draft grade to publish for this submission." });
    }

    submission.aiGrade = submission.pendingAiGrade;
    submission.aiFeedback = submission.pendingAiFeedback;
    await submission.save();

    res.status(200).json({ message: "Grade published to student.", submission });
  } catch (error) {
    const status = error.status || 500;
    console.error("Publish Submission Error:", error.message || error);
    res.status(status).json({ message: error.message || "Server error publishing grade" });
  }
};

// ===================================================
// POST /api/grading/assignments/:assignmentId/publish
// ===================================================
// Protected: Instructor (owner) / Admin
// Bulk-publishes every submission for this assignment that has a
// draft grade but isn't published yet.
const publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await assertCanManageAssignment(assignment, req.user);

    const submissions = await Submission.find({
      assignment: assignment._id,
      aiGrade: null,
      pendingAiGrade: { $ne: null },
    });

    for (const submission of submissions) {
      submission.aiGrade = submission.pendingAiGrade;
      submission.aiFeedback = submission.pendingAiFeedback;
      await submission.save();
    }

    res.status(200).json({
      message: `Published ${submissions.length} grade(s) to students.`,
      publishedCount: submissions.length,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("Publish Assignment Error:", error.message || error);
    res.status(status).json({ message: error.message || "Server error publishing grades" });
  }
};

// ===================================================
// PUT /api/grading/submissions/:id/override
// ===================================================
// Protected: Instructor (owner) / Admin
// Manually update/override the grade and feedback for a submission.
const overrideSubmissionGrade = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found for this submission" });
    }

    await assertCanManageAssignment(assignment, req.user);

    if (grade !== undefined && grade !== null && grade !== "") {
      const numGrade = Number(grade);
      if (isNaN(numGrade) || numGrade < 0 || numGrade > assignment.totalPoints) {
        return res.status(400).json({
          message: `Grade must be a number between 0 and ${assignment.totalPoints}`,
        });
      }
      submission.pendingAiGrade = numGrade;
      if (submission.aiGrade !== null && submission.aiGrade !== undefined) {
        submission.aiGrade = numGrade;
      }
    }

    if (feedback !== undefined) {
      submission.pendingAiFeedback = feedback;
      if (submission.aiGrade !== null && submission.aiGrade !== undefined) {
        submission.aiFeedback = feedback;
      }
    }

    await submission.save();

    res.status(200).json({
      message: "Grade and feedback updated successfully.",
      submission,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error("Override Submission Grade Error:", error.message || error);
    res.status(status).json({ message: error.message || "Server error updating grade" });
  }
};

module.exports = {
  autogradeAssignment,
  getJobStatus,
  regradeSubmission,
  publishSubmission,
  publishAssignment,
  overrideSubmissionGrade,
};
