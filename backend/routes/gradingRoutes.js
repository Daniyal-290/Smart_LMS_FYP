const express = require("express");
const {
  autogradeAssignment,
  getJobStatus,
  regradeSubmission,
  publishSubmission,
  publishAssignment,
  overrideSubmissionGrade,
} = require("../controllers/gradingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Mounted at /api/grading in server.js — kept as its own route file
// so the AI teammate's work doesn't collide with teammates editing
// assignmentRoutes.js / submissionRoutes.js directly.

router.post(
  "/assignments/:assignmentId/autograde",
  protect,
  authorizeRoles("Instructor", "Admin"),
  upload.single("rubricFile"),
  autogradeAssignment
);

router.get("/jobs/:jobId", protect, authorizeRoles("Instructor", "Admin"), getJobStatus);

router.post("/submissions/:id/grade", protect, authorizeRoles("Instructor", "Admin"), regradeSubmission);

router.put("/submissions/:id/override", protect, authorizeRoles("Instructor", "Admin"), overrideSubmissionGrade);

router.post("/submissions/:id/publish", protect, authorizeRoles("Instructor", "Admin"), publishSubmission);

router.post(
  "/assignments/:assignmentId/publish",
  protect,
  authorizeRoles("Instructor", "Admin"),
  publishAssignment
);

module.exports = router;
