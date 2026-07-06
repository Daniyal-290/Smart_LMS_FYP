const express = require("express");
const { getMidtermRisk } = require("../controllers/reportController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/reports/midterm-risk — Download CSV of at-risk students (Instructors only)
router.get("/midterm-risk", protect, authorizeRoles("Instructor"), getMidtermRisk);

module.exports = router;
