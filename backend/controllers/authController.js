const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===================================================
// Helper — Generate a signed JWT
// ===================================================
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ===================================================
// POST /api/auth/signup
// ===================================================
// Registers a new user (Instructor or Student).
// Expects: { name, email, password, role, enrollmentId?, class?, program? }

const signup = async (req, res) => {
  try {
    const { name, email, password, role, enrollmentId, adminSecret, class: userClass, program } = req.body;

    // --- Basic Validation ---
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, password, and role" });
    }

    // --- Domain Lock for Students ---
    if (role === "Student") {
      if (!email.toLowerCase().endsWith("@bahria.edu.pk")) {
        return res
          .status(400)
          .json({ message: "Registration restricted to valid university email addresses." });
      }
      if (!enrollmentId) {
        return res
          .status(400)
          .json({ message: "Enrollment ID is strictly required for students." });
      }
    }

    // --- Secret Passcode for Instructors ---
    if (role === "Instructor") {
      if (!adminSecret || adminSecret !== process.env.INSTRUCTOR_SECRET) {
        return res
          .status(403)
          .json({ message: "Unauthorized: Invalid instructor provisioning code." });
      }
    }

    // --- Duplicate Email Check ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists" });
    }

    // --- Create User (Password Hashing via User Model) ---
    // Note: The prompt mentioned hashing via bcrypt here, but our User.js model already has a 
    // highly secure pre("save") hook that automatically hashes the password! Doing it here 
    // again would result in a double-hash and break login. So we let Mongoose handle it.
    const user = await User.create({
      name,
      email,
      password,
      role,
      enrollmentId,
      class: userClass,
      program,
    });

    // --- Return JWT Token & User Data ---
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// ===================================================
// POST /api/auth/login
// ===================================================
// Authenticates a user and returns a JWT.
// Expects: { email, password }

const login = async (req, res) => {
  try {
    const { email, enrollmentId, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please provide a password" });
    }

    if (!email && !enrollmentId) {
      return res.status(400).json({ message: "Please provide an email or enrollment ID" });
    }

    // Find user by either email or enrollmentId
    const query = enrollmentId ? { enrollmentId } : { email };
    const user = await User.findOne(query).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare candidate password with stored hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Return user info + token
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ===================================================
// POST /api/auth/register-faculty
// ===================================================
// Protected: Admin only
const registerFaculty = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "Instructor",
    });

    res.status(201).json({
      message: "Faculty account created successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Faculty Registration Error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors).map(v => v.message).join(", ") });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ===================================================
// GET /api/auth/instructors
// ===================================================
// Protected: Admin only
const getInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: "Instructor" }).select("name email");
    res.status(200).json(instructors);
  } catch (error) {
    console.error("Get Instructors Error:", error.message);
    res.status(500).json({ message: "Server error fetching instructors" });
  }
};

// ===================================================
// POST /api/auth/register-student
// ===================================================
// Protected: Admin only
const registerStudent = async (req, res) => {
  try {
    const { name, email, enrollmentId, class: userClass, program, password } = req.body;

    if (!name || !email || !enrollmentId || !userClass || !program || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { enrollmentId }] });
    if (userExists) {
      return res.status(400).json({ message: "User with this email or enrollment ID already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "Student",
      enrollmentId,
      class: userClass,
      program,
    });

    res.status(201).json({
      message: "Student account created successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Student Registration Error:", error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ===================================================
// GET /api/auth/stats
// ===================================================
// Protected: Admin
// Get total counts of students and teachers
const getUserStats = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: "Student" });
    const teacherCount = await User.countDocuments({ role: "Instructor" });
    res.status(200).json({ students: studentCount, teachers: teacherCount });
  } catch (error) {
    console.error("Get User Stats Error:", error.message);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};

// ===================================================
// GET /api/auth/students
// ===================================================
// Protected: Admin only
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "Student" }).select("name email enrollmentId class program createdAt");
    res.status(200).json(students);
  } catch (error) {
    console.error("Get Students Error:", error.message);
    res.status(500).json({ message: "Server error fetching students" });
  }
};

// ===================================================
// PUT /api/auth/students/:id
// ===================================================
// Protected: Admin only
const updateStudent = async (req, res) => {
  try {
    const { name, email, enrollmentId, class: userClass, program } = req.body;
    const student = await User.findOne({ _id: req.params.id, role: "Student" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (name) student.name = name;
    if (email) student.email = email;
    if (enrollmentId) student.enrollmentId = enrollmentId;
    if (userClass) student.class = userClass;
    if (program) student.program = program;

    await student.save();
    res.status(200).json({ message: "Student updated successfully", student });
  } catch (error) {
    console.error("Update Student Error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors).map(v => v.message).join(", ") });
    }
    res.status(500).json({ message: "Server error updating student" });
  }
};

// ===================================================
// DELETE /api/auth/students/:id
// ===================================================
// Protected: Admin only
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: "Student" });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete Student Error:", error.message);
    res.status(500).json({ message: "Server error deleting student" });
  }
};

// ===================================================
// PUT /api/auth/teachers/:id
// ===================================================
// Protected: Admin only
const updateTeacher = async (req, res) => {
  try {
    const { name, email } = req.body;
    const teacher = await User.findOne({ _id: req.params.id, role: "Instructor" });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    if (name) teacher.name = name;
    if (email) teacher.email = email;

    await teacher.save();
    res.status(200).json({ message: "Teacher updated successfully", teacher });
  } catch (error) {
    console.error("Update Teacher Error:", error.message);
    res.status(500).json({ message: "Server error updating teacher" });
  }
};

// ===================================================
// DELETE /api/auth/teachers/:id
// ===================================================
// Protected: Admin only
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: "Instructor" });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Delete Teacher Error:", error.message);
    res.status(500).json({ message: "Server error deleting teacher" });
  }
};

module.exports = {
  signup,
  login,
  registerFaculty,
  registerStudent,
  getInstructors,
  getUserStats,
  getStudents,
  updateStudent,
  deleteStudent,
  updateTeacher,
  deleteTeacher,
};
