const express = require("express");
const {
  createAssignment,
  getAssignments,
  getCourseAssignments,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("Instructor", "Admin"), upload.single("file"), createAssignment);
router.get("/", protect, getAssignments);
router.get("/course/:courseId", protect, getCourseAssignments);
router.put("/:id", protect, authorizeRoles("Instructor", "Admin"), upload.single("file"), updateAssignment);
router.delete("/:id", protect, authorizeRoles("Instructor", "Admin"), deleteAssignment);

module.exports = router;
