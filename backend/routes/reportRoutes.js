const express = require("express");
const {
  saveMidtermMarks,
  getMidtermMarks,
  getMidtermRisk,
} = require("../controllers/reportController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/reports/midterm-marks — Bulk upsert midterm marks (Instructors only)
router.post("/midterm-marks", protect, authorizeRoles("Instructor"), saveMidtermMarks);

// GET  /api/reports/midterm-marks/:courseId — Fetch saved marks for a course (Instructors only)
router.get("/midterm-marks/:courseId", protect, authorizeRoles("Instructor"), getMidtermMarks);

// GET  /api/reports/midterm-risk/:courseId — Fetch at-risk students (Instructors only)
//      Supports ?format=csv for CSV download
router.get("/midterm-risk/:courseId", protect, authorizeRoles("Instructor"), getMidtermRisk);

module.exports = router;
