const { Parser } = require("json2csv");
const MidtermMark = require("../models/MidtermMark");
const ExamPolicy = require("../models/ExamPolicy");
const Course = require("../models/Course");
const User = require("../models/User");

// ===================================================
// POST /api/reports/midterm-marks
// ===================================================
// Protected: Instructors only.
//
// Bulk upsert midterm marks for students in a course.
// Body: { courseId, marks: [{ studentId, marks }] }

const saveMidtermMarks = async (req, res) => {
  try {
    const { courseId, marks } = req.body;

    // --- Validation ---
    if (!courseId || !marks || !Array.isArray(marks) || marks.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide courseId and a marks array" });
    }

    // Fetch admin-set exam policy to get the total
    const policy = await ExamPolicy.findOne();
    if (!policy) {
      return res.status(400).json({
        message: "Exam policy has not been configured by the admin yet",
      });
    }

    const totalMarks = policy.midtermTotalMarks;

    // Validate that no marks exceed the total
    for (const entry of marks) {
      if (entry.marks < 0 || entry.marks > totalMarks) {
        return res.status(400).json({
          message: `Marks must be between 0 and ${totalMarks}`,
        });
      }
    }

    // Bulk upsert using bulkWrite for efficiency
    const operations = marks.map((entry) => ({
      updateOne: {
        filter: { course: courseId, student: entry.studentId },
        update: {
          $set: {
            marks: entry.marks,
            totalMarks,
            enteredBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await MidtermMark.bulkWrite(operations);

    res.status(200).json({
      message: "Midterm marks saved successfully",
      count: marks.length,
    });
  } catch (error) {
    console.error("Save midterm marks error:", error.message);
    res.status(500).json({ message: "Server error saving midterm marks" });
  }
};

// ===================================================
// GET /api/reports/midterm-marks/:courseId
// ===================================================
// Protected: Instructors only.
// Fetch saved midterm marks for a specific course.

const getMidtermMarks = async (req, res) => {
  try {
    const { courseId } = req.params;

    const marks = await MidtermMark.find({ course: courseId })
      .populate("student", "name email enrollmentId")
      .lean();

    res.status(200).json(marks);
  } catch (error) {
    console.error("Get midterm marks error:", error.message);
    res.status(500).json({ message: "Server error fetching midterm marks" });
  }
};

// ===================================================
// GET /api/reports/midterm-risk/:courseId
// ===================================================
// Protected: Instructors only.
// Fetch at-risk students (scoring < 50% of total) for
// a specific course.
// Supports ?format=csv for CSV download.

const getMidtermRisk = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { format } = req.query;

    // Fetch all midterm marks for this course
    const allMarks = await MidtermMark.find({ course: courseId })
      .populate("student", "name enrollmentId class program")
      .lean();

    if (allMarks.length === 0) {
      if (format === "csv") {
        return res.status(200).json({
          message: "No midterm marks found for this course",
          count: 0,
        });
      }
      return res.status(200).json([]);
    }

    // Filter: students scoring below 50% of totalMarks
    const atRiskStudents = allMarks.filter((m) => {
      const threshold = m.totalMarks * 0.5;
      return m.marks < threshold;
    });

    // If CSV download requested
    if (format === "csv") {
      if (atRiskStudents.length === 0) {
        return res.status(200).json({
          message: "No at-risk students found (all scores >= 50%)",
          count: 0,
        });
      }

      // Get course title for the report
      const course = await Course.findById(courseId).select("title").lean();

      const csvData = atRiskStudents.map((m) => ({
        Name: m.student?.name || "Unknown",
        "Enrollment ID": m.student?.enrollmentId || "N/A",
        Class: m.student?.class || "N/A",
        Program: m.student?.program || "N/A",
        Course: course?.title || "N/A",
        "Marks Obtained": m.marks,
        "Total Marks": m.totalMarks,
        "Percentage (%)": ((m.marks / m.totalMarks) * 100).toFixed(2),
      }));

      const fields = [
        "Name",
        "Enrollment ID",
        "Class",
        "Program",
        "Course",
        "Marks Obtained",
        "Total Marks",
        "Percentage (%)",
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(csvData);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="midterm-risk-report.csv"'
      );

      return res.status(200).send(csv);
    }

    // Default: return JSON
    res.status(200).json(atRiskStudents);
  } catch (error) {
    console.error("Mid-term risk report error:", error.message);
    res
      .status(500)
      .json({ message: "Server error generating mid-term risk report" });
  }
};

module.exports = { saveMidtermMarks, getMidtermMarks, getMidtermRisk };
