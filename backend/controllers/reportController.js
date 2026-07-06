const { Parser } = require("json2csv");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const User = require("../models/User");

// ===================================================
// GET /api/reports/midterm-risk
// ===================================================
// Protected: Instructors only.
//
// Flow:
//   1. Aggregate all submissions and compute each
//      student's average grade.
//   2. Filter students with average < 50% of total
//      points (at-risk threshold).
//   3. Enrich with student profile data.
//   4. Convert to CSV and pipe as a downloadable file.

const getMidtermRisk = async (req, res) => {
  try {
    // --------------------------------------------------
    // Step 1 — Aggregate average grades per student
    // --------------------------------------------------
    const studentAverages = await Submission.aggregate([
      {
        // Only consider submissions that have been graded
        $match: { aiGrade: { $ne: null } },
      },
      {
        // Look up the assignment to get totalPoints
        $lookup: {
          from: "assignments",
          localField: "assignment",
          foreignField: "_id",
          as: "assignmentData",
        },
      },
      { $unwind: "$assignmentData" },
      {
        // Compute the percentage for each submission
        $addFields: {
          gradePercent: {
            $multiply: [
              { $divide: ["$aiGrade", "$assignmentData.totalPoints"] },
              100,
            ],
          },
          courseId: "$assignmentData.course",
        },
      },
      {
        // Group by student and compute average percentage
        $group: {
          _id: "$student",
          avgGrade: { $avg: "$gradePercent" },
          courses: { $addToSet: "$courseId" },
        },
      },
      {
        // Filter: only students below 50%
        $match: { avgGrade: { $lt: 50 } },
      },
    ]);

    // --------------------------------------------------
    // Step 2 — Enrich with student profile + course data
    // --------------------------------------------------
    const atRiskStudents = [];

    for (const record of studentAverages) {
      const student = await User.findById(record._id).select(
        "name enrollmentId class program"
      );

      if (!student) continue;

      // Get course titles for this student
      const courses = await Course.find({
        _id: { $in: record.courses },
      }).select("title");

      const courseNames = courses.map((c) => c.title).join(", ");

      atRiskStudents.push({
        Name: student.name,
        "Enrollment ID": student.enrollmentId || "N/A",
        Class: student.class || "N/A",
        Course: courseNames || "N/A",
        Program: student.program || "N/A",
        "Average (%)": record.avgGrade.toFixed(2),
      });
    }

    // --------------------------------------------------
    // Step 3 — If no at-risk students, return early
    // --------------------------------------------------
    if (atRiskStudents.length === 0) {
      return res.status(200).json({
        message: "No at-risk students found (all averages >= 50%)",
        count: 0,
      });
    }

    // --------------------------------------------------
    // Step 4 — Convert to CSV and send as download
    // --------------------------------------------------
    const fields = [
      "Name",
      "Enrollment ID",
      "Class",
      "Course",
      "Program",
      "Average (%)",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(atRiskStudents);

    // Set response headers for CSV file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="midterm-risk-report.csv"'
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Mid-term risk report error:", error.message);
    res
      .status(500)
      .json({ message: "Server error generating mid-term risk report" });
  }
};

module.exports = { getMidtermRisk };
