const mongoose = require("mongoose");

/**
 * connectDB
 * ---------
 * Establishes a cached connection to MongoDB suitable for both traditional Node.js
 * servers and Vercel Serverless Functions.
 *
 * Caches the connection globally (`global.mongoose`) across serverless function
 * invocations to prevent redundant connections and avoids process.exit(1) so cold
 * start timeouts or temporary connection hiccups do not crash the serverless container.
 */

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing.");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering so requests don't hang if disconnected
      family: 4, // Force IPv4 to fix DNS resolution bug with Node/Atlas on Windows/Serverless
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of hanging indefinitely
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((error) => {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        cached.promise = null; // Reset promise so next request can retry
        throw error; // Do NOT call process.exit(1) in serverless environments!
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
