const express = require("express");
const { createSubmission, getMyGrades, getCourseSubmissions } = require("../controllers/submissionController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// POST /api/submissions — Submit an assignment (Students only)
router.post("/", protect, authorizeRoles("Student"), upload.single("file"), createSubmission);
router.get("/me", protect, authorizeRoles("Student"), getMyGrades);
router.get("/course/:courseId", protect, authorizeRoles("Instructor", "Admin"), getCourseSubmissions);

module.exports = router;
