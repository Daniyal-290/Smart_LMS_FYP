const ExamPolicy = require("../models/ExamPolicy");

// ===================================================
// GET /api/exam-policy
// ===================================================
// Protected: Any authenticated user.
// Fetch the current exam policy (singleton document).

const getExamPolicy = async (req, res) => {
  try {
    const policy = await ExamPolicy.findOne();

    if (!policy) {
      return res.status(200).json({
        message: "No exam policy configured yet",
        policy: null,
      });
    }

    res.status(200).json(policy);
  } catch (error) {
    console.error("Get exam policy error:", error.message);
    res.status(500).json({ message: "Server error fetching exam policy" });
  }
};

// ===================================================
// PUT /api/exam-policy
// ===================================================
// Protected: Admin only.
// Create or update the singleton exam policy document.

const updateExamPolicy = async (req, res) => {
  try {
    const { midtermTotalMarks, finalsTotalMarks } = req.body;

    // --- Validation ---
    if (!midtermTotalMarks || !finalsTotalMarks) {
      return res
        .status(400)
        .json({ message: "Please provide midtermTotalMarks and finalsTotalMarks" });
    }

    if (midtermTotalMarks < 1 || finalsTotalMarks < 1) {
      return res
        .status(400)
        .json({ message: "Total marks must be at least 1" });
    }

    // Upsert: find existing or create new
    const policy = await ExamPolicy.findOneAndUpdate(
      {}, // empty filter — singleton
      {
        midtermTotalMarks,
        finalsTotalMarks,
        updatedBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: "Exam policy updated successfully",
      policy,
    });
  } catch (error) {
    console.error("Update exam policy error:", error.message);
    res.status(500).json({ message: "Server error updating exam policy" });
  }
};

module.exports = { getExamPolicy, updateExamPolicy };
