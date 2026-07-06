const mongoose = require("mongoose");

/**
 * connectDB
 * ---------
 * Establishes a connection to MongoDB using the URI from .env.
 * Exits the process with code 1 if the connection fails.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4 // Force IPv4 to fix DNS resolution bug with Node/Atlas on Windows
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
