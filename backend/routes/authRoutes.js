const express = require("express");
const {
  signup, login, registerFaculty, getInstructors, registerStudent, getUserStats,
  getStudents, updateStudent, deleteStudent, updateTeacher, deleteTeacher
} = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/signup — Register a new user
router.post("/signup", signup);

// POST /api/auth/login  — Authenticate and get JWT
router.post("/login", login);
router.post("/register-faculty", protect, authorizeRoles("Admin"), registerFaculty);
router.post("/register-student", protect, authorizeRoles("Admin"), registerStudent);
router.get("/instructors", protect, authorizeRoles("Admin"), getInstructors);
router.get("/stats", protect, authorizeRoles("Admin"), getUserStats);

// Student CRUD
router.get("/students", protect, authorizeRoles("Admin"), getStudents);
router.put("/students/:id", protect, authorizeRoles("Admin"), updateStudent);
router.delete("/students/:id", protect, authorizeRoles("Admin"), deleteStudent);

// Teacher CRUD
router.put("/teachers/:id", protect, authorizeRoles("Admin"), updateTeacher);
router.delete("/teachers/:id", protect, authorizeRoles("Admin"), deleteTeacher);

module.exports = router;
