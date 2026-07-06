const express = require("express");
const { recordAttendance } = require("../controllers/attendanceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/attendance
router.post("/", protect, authorizeRoles("Instructor", "Admin"), recordAttendance);

module.exports = router;
