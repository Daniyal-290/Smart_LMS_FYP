const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ===================================================
// User Schema
// ===================================================
// Represents Instructors, Students, and Admin.
// Password is automatically hashed before saving.

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never return password by default in queries
    },

    role: {
      type: String,
      enum: ["Instructor", "Student", "Admin"],
      default: "Student",
      required: [true, "Role is required"],
    },

    enrollmentId: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.role === "Student";
        },
        "Enrollment ID is required for students",
      ],
      validate: {
        validator: function (v) {
          // If not a student, skip regex validation
          if (this.role !== "Student") return true;
          // Allow letters, numbers, and dashes (e.g. SP26-BCS-041)
          return /^[a-zA-Z0-9\-]+$/.test(v);
        },
        message: "Enrollment ID must contain only alphanumeric characters and dashes",
      },
    },

    class: {
      type: String,
      trim: true,
    },

    program: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------
// Pre-save hook — Hash the password before persisting
// ---------------------------------------------------
userSchema.pre("save", async function (next) {
  // Only hash if password was modified (avoids re-hashing on profile update)
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---------------------------------------------------
// Instance method — Compare candidate password to hash
// ---------------------------------------------------
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
