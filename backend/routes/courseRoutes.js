const express = require("express");
const { createCourse, getCourseById, getCourses, getAllCourses, enrollStudent } = require("../controllers/courseController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("Admin", "Instructor"), createCourse);
router.get("/", protect, getCourses);
router.get("/all", protect, authorizeRoles("Admin", "Instructor", "Student"), getAllCourses);
router.get("/:id", protect, getCourseById);
router.put("/:id/enroll", protect, authorizeRoles("Admin", "Instructor", "Student"), enrollStudent);

module.exports = router;
