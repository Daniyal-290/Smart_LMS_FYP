const { GoogleGenAI } = require("@google/genai");

// ===================================================
// Gemini Client (singleton)
// ===================================================
// Central place that creates the GoogleGenAI client and
// exposes the model name used across the AI grading engine.
// Keeping this in one file means we only ever change the
// model/version in one place.

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "⚠️  GEMINI_API_KEY is not set in .env — AI grading/rubric parsing will fail until it is."
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Default model — can be overridden in .env without touching code.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

module.exports = { ai, GEMINI_MODEL };
