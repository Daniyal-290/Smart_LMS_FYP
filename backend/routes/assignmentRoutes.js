const express = require("express");
const { createAssignment, getAssignments, getCourseAssignments } = require("../controllers/assignmentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("Instructor", "Admin"), upload.single("file"), createAssignment);
router.get("/", protect, getAssignments);
router.get("/course/:courseId", protect, getCourseAssignments);

module.exports = router;
