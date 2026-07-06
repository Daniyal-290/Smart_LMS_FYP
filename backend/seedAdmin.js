require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("Connected to MongoDB");

    await User.deleteOne({ email: "admin@smartlms.com" });

    await User.create({
      name: "System Admin",
      email: "admin@smartlms.com",
      password: "admin123",
      role: "Admin"
    });

    console.log("✅ Admin account created successfully!");
    console.log("Email: admin@smartlms.com");
    console.log("Password: admin123");
    
    process.exit();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
