const express = require("express");
const { getExamPolicy, updateExamPolicy } = require("../controllers/examPolicyController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// GET  /api/exam-policy — Fetch current exam policy (any authenticated user)
router.get("/", protect, getExamPolicy);

// PUT  /api/exam-policy — Create or update exam policy (Admin only)
router.put("/", protect, authorizeRoles("Admin"), updateExamPolicy);

module.exports = router;
