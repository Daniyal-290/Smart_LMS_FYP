// ===================================================
// SmartLMS Backend — Entry Point
// ===================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables from .env
dotenv.config();

// Import route modules
const authRoutes = require("./routes/authRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const gradingRoutes = require("./routes/gradingRoutes");
const examPolicyRoutes = require("./routes/examPolicyRoutes");
const quizRoutes = require("./routes/quizRoutes");

// Initialize Express
const app = express();

const path = require("path");

// ---------------------------------------------------
// Global Middleware
// ---------------------------------------------------
app.use(cors());                  // Enable CORS for frontend
app.use(express.json());          // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", (req, res) => {
  res.status(404).json({
    message:
      "Uploaded file not found on this server. If this record was created on another machine, please re-upload the file.",
  });
});

// ---------------------------------------------------
// API Routes
// ---------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/grading", gradingRoutes); // AI auto-grading engine (async job-based, draft/publish workflow)
app.use("/api/exam-policy", examPolicyRoutes);
app.use("/api/quizzes", quizRoutes);

// ---------------------------------------------------
// Health Check
// ---------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    message: "SmartLMS API is running",
    version: "1.0.0",
  });
});

// ---------------------------------------------------
// 404 Handler
// ---------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ---------------------------------------------------
// Global Error Handler
// ---------------------------------------------------
app.use((err, req, res, next) => {
  if (err && err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Maximum allowed size is 50MB."
        : err.message;
    return res.status(400).json({ message });
  }
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ---------------------------------------------------
// Start Server
// ---------------------------------------------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SmartLMS server running on port ${PORT}`);
  });
});
