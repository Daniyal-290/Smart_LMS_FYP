const express = require("express");
const { uploadLecture, getCourseLectures } = require("../controllers/lectureController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("Instructor", "Admin"), upload.single("file"), uploadLecture);
router.get("/course/:courseId", protect, authorizeRoles("Student", "Instructor", "Admin"), getCourseLectures);

module.exports = router;
