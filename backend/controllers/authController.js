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

module.exports = {
  signup,
  login,
  registerFaculty,
  registerStudent,
  getInstructors,
  getUserStats
};
