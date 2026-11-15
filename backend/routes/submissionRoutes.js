const express = require("express");
const {
  createSubmission,
  getMyGrades,
  getCourseSubmissions,
  getInstructorPlagiarismFlags,
  updatePlagiarismStatus,
} = require("../controllers/submissionController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Specific routes before generic /:id routes
router.get(
  "/instructor/plagiarism-flags",
  protect,
  authorizeRoles("Instructor", "Admin"),
  getInstructorPlagiarismFlags
);
router.patch(
  "/:id/plagiarism-status",
  protect,
  authorizeRoles("Instructor", "Admin"),
  updatePlagiarismStatus
);

// POST /api/submissions — Submit an assignment (Students only)
router.post("/", protect, authorizeRoles("Student"), upload.single("file"), createSubmission);
router.get("/me", protect, authorizeRoles("Student"), getMyGrades);
router.get("/course/:courseId", protect, authorizeRoles("Instructor", "Admin"), getCourseSubmissions);

module.exports = router;
