const express = require("express");
const { getStudentDashboard } = require("../controllers/dashboardController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/dashboard/student
router.get("/student", protect, authorizeRoles("Student"), getStudentDashboard);

module.exports = router;
