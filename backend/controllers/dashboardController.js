const Course = require("../models/Course");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Attendance = require("../models/Attendance");

// ===================================================
// GET /api/dashboard/student
// ===================================================
// Protected: Students only.
// Fetches real data for the student dashboard.

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Enrolled Courses Count
    const enrolledCourses = await Course.find({ students: studentId });
    const enrolledCount = enrolledCourses.length;

    // 2. Pending Assignments (Assignments in enrolled courses with no submission by this student)
    const courseIds = enrolledCourses.map((c) => c._id);
    const allAssignments = await Assignment.find({ course: { $in: courseIds } });
    
    const submissions = await Submission.find({ student: studentId });
    const submittedAssignmentIds = submissions.map((s) => s.assignment.toString());
    
    let pendingCount = 0;
    const now = new Date();
    allAssignments.forEach((assignment) => {
      const isSubmitted = submittedAssignmentIds.includes(assignment._id.toString());
      const isLate = assignment.dueDate && new Date(assignment.dueDate) < now;
      if (!isSubmitted && !isLate) {
        pendingCount++;
      }
    });

    // 3. Current GPA Calculation (Average of graded submissions out of 4.0 scale)
    // We assume 90-100 = 4.0, 80-89 = 3.0, 70-79 = 2.0, 60-69 = 1.0, <60 = 0.0
    let totalPoints = 0;
    let totalMaxPoints = 0;
    let gpa = "N/A";

    // Need to lookup max points for each graded submission
    let gradedCount = 0;
    let gpaSum = 0;

    for (let sub of submissions) {
      if (sub.aiGrade != null) {
        const assign = allAssignments.find(a => a._id.toString() === sub.assignment.toString());
        if (assign && assign.totalPoints) {
          const percent = (sub.aiGrade / assign.totalPoints) * 100;
          let gradePoint = 0;
          if (percent >= 90) gradePoint = 4.0;
          else if (percent >= 80) gradePoint = 3.0;
          else if (percent >= 70) gradePoint = 2.0;
          else if (percent >= 60) gradePoint = 1.0;
          else gradePoint = 0.0;
          
          gpaSum += gradePoint;
          gradedCount++;
        }
      }
    }

    if (gradedCount > 0) {
      gpa = (gpaSum / gradedCount).toFixed(2);
    }

    // 4. Upcoming Quizzes (Mocked for now since Quiz model doesn't exist)
    const upcomingQuizzes = 0;

    // 5. Course Attendance
    const allAttendances = await Attendance.find({ course: { $in: courseIds } });
    
    const attendance = enrolledCourses.map(course => {
      const courseAttendances = allAttendances.filter(a => a.course.toString() === course._id.toString());
      const total = courseAttendances.length;
      let attended = 0;
      
      courseAttendances.forEach(a => {
        const record = a.records.find(r => r.student.toString() === studentId.toString());
        if (record && (record.status === "Present" || record.status === "Late")) {
          attended++;
        }
      });
      
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
      
      return {
        course: course.title,
        attended,
        total,
        percentage,
      };
    });

    res.status(200).json({
      enrolledCount,
      pendingCount,
      gpa,
      upcomingQuizzes,
      attendance,
      user: {
        name: req.user.name,
        class: req.user.class,
        program: req.user.program
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error.message);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
};

module.exports = { getStudentDashboard };
