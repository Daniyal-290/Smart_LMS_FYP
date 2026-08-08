const PracticeQuiz = require("../models/PracticeQuiz");
const QuizAttempt = require("../models/QuizAttempt");
const Lecture = require("../models/Lecture");
const { generateQuizFromLecture } = require("../services/quizService");

// ===================================================
// POST /api/quizzes/lecture/:lectureId/generate
// ===================================================
// Protected: Instructors and Students.
// Generates or fetches the cached practice quiz for a lecture.
const generateOrGetQuiz = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // Check if quiz already exists and is ready
    let quiz = await PracticeQuiz.findOne({ lecture: lectureId });

    if (quiz && quiz.status === "ready") {
      return res.status(200).json({
        message: "Existing quiz loaded",
        quiz,
      });
    }

    // Generate quiz using Gemini
    try {
      const { questions } = await generateQuizFromLecture(lecture);

      quiz = await PracticeQuiz.findOneAndUpdate(
        { lecture: lectureId },
        {
          course: lecture.course,
          title: `Practice Quiz: ${lecture.title}`,
          questions,
          totalQuestions: questions.length,
          status: "ready",
          errorMessage: "",
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        message: "Practice quiz generated successfully",
        quiz,
      });
    } catch (genError) {
      console.error("Quiz Generation Failure:", genError.message);
      await PracticeQuiz.findOneAndUpdate(
        { lecture: lectureId },
        {
          course: lecture.course,
          title: `Practice Quiz: ${lecture.title}`,
          status: "failed",
          errorMessage: genError.message || "Failed to generate quiz",
        },
        { new: true, upsert: true }
      );
      return res.status(400).json({ message: genError.message || "Failed to generate quiz" });
    }
  } catch (error) {
    console.error("Quiz Generation Error:", error.message);
    res.status(500).json({ message: "Server error during quiz generation" });
  }
};

// ===================================================
// GET /api/quizzes/lecture/:lectureId
// ===================================================
// Protected: Instructors, Students, Admins.
// Fetches the practice quiz for a lecture.
const getQuizByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const quiz = await PracticeQuiz.findOne({ lecture: lectureId, status: "ready" }).lean();
    if (!quiz) {
      return res.status(404).json({ message: "No active practice quiz found for this lecture" });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Get Quiz Error:", error.message);
    res.status(500).json({ message: "Server error fetching practice quiz" });
  }
};

// ===================================================
// POST /api/quizzes/:quizId/attempt
// ===================================================
// Protected: Students.
// Submits a practice quiz attempt, scores it, and returns instant results with explanations.
const submitAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userAnswers } = req.body; // Array of { questionIndex, selectedOptionIndex }

    const quiz = await PracticeQuiz.findById(quizId);
    if (!quiz || quiz.status !== "ready") {
      return res.status(404).json({ message: "Practice quiz not found or not ready" });
    }

    if (!Array.isArray(userAnswers)) {
      return res.status(400).json({ message: "Invalid user answers format" });
    }

    let score = 0;
    const evaluatedAnswers = quiz.questions.map((q, index) => {
      const studentAns = userAnswers.find((a) => a.questionIndex === index);
      const selectedIndex = studentAns ? studentAns.selectedOptionIndex : null;
      const isCorrect = selectedIndex === q.correctOptionIndex;

      if (isCorrect) {
        score += 1;
      }

      return {
        questionIndex: index,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Record the attempt for student practice tracking
    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      lecture: quiz.lecture,
      student: req.user._id,
      score,
      totalQuestions,
      percentage,
      answers: evaluatedAnswers.map((a) => ({
        questionIndex: a.questionIndex,
        selectedOptionIndex: a.selectedOptionIndex,
        isCorrect: a.isCorrect,
      })),
    });

    res.status(200).json({
      message: "Quiz attempt evaluated",
      attemptId: attempt._id,
      score,
      totalQuestions,
      percentage,
      evaluatedAnswers,
    });
  } catch (error) {
    console.error("Submit Quiz Attempt Error:", error.message);
    res.status(500).json({ message: "Server error submitting quiz attempt" });
  }
};

// ===================================================
// GET /api/quizzes/attempts/lecture/:lectureId
// ===================================================
// Protected: Students.
// Fetches previous practice attempts by the student for a lecture.
const getStudentAttempts = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const attempts = await QuizAttempt.find({
      lecture: lectureId,
      student: req.user._id,
    })
      .sort("-createdAt")
      .limit(10);

    res.status(200).json(attempts);
  } catch (error) {
    console.error("Get Student Quiz Attempts Error:", error.message);
    res.status(500).json({ message: "Server error fetching quiz attempts" });
  }
};

module.exports = {
  generateOrGetQuiz,
  getQuizByLecture,
  submitAttempt,
  getStudentAttempts,
};
