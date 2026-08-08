const express = require("express");
const {
  generateOrGetQuiz,
  getQuizByLecture,
  submitAttempt,
  getStudentAttempts,
} = require("../controllers/quizController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/quizzes/lecture/:lectureId/generate — Generate or fetch quiz
router.post("/lecture/:lectureId/generate", protect, generateOrGetQuiz);

// GET /api/quizzes/lecture/:lectureId — Fetch practice quiz
router.get("/lecture/:lectureId", protect, getQuizByLecture);

// POST /api/quizzes/:quizId/attempt — Submit practice quiz attempt (Students)
router.post("/:quizId/attempt", protect, authorizeRoles("Student"), submitAttempt);

// GET /api/quizzes/attempts/lecture/:lectureId — Get student attempts
router.get("/attempts/lecture/:lectureId", protect, authorizeRoles("Student"), getStudentAttempts);

module.exports = router;
