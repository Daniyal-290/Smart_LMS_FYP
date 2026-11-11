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

const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientError(err) {
  const status = err?.status || err?.code;
  if (status === 503 || status === 429) return true;
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("resource_exhausted")
  );
}

/**
 * Calls `ai.models.generateContent` with exponential backoff on transient
 * 503/429 errors and falls back to alternative Flash models if the configured
 * model remains unavailable.
 */
async function generateWithRetry({ contents, config, model = GEMINI_MODEL }) {
  const candidateModels = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
  let lastError;

  for (const candidate of candidateModels) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await ai.models.generateContent({
          model: candidate,
          contents,
          config,
        });
      } catch (err) {
        lastError = err;
        if (!isTransientError(err)) {
          throw err;
        }
        const delayMs = attempt * 2000;
        console.warn(
          `Gemini transient error on ${candidate} (attempt ${attempt}/${maxAttempts}): ${err.message}. Retrying...`
        );
        await sleep(delayMs);
      }
    }
    console.warn(`Switching from ${candidate} to next fallback Gemini model due to unavailability.`);
  }

  throw lastError;
}

/**
 * Generates vector embeddings for a given text using `gemini-embedding-001`
 * (with automatic fallback to `gemini-embedding-2`) and retries on transient errors.
 */
async function embedContentWithRetry(text, model = "gemini-embedding-001") {
  if (!text || !text.trim()) return [];
  const candidateModels = [model, "gemini-embedding-2", "gemini-embedding-001"].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );
  let lastError;

  for (const candidate of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.embedContent({
          model: candidate,
          contents: text.slice(0, 10000),
        });
        const vec = res.embedding?.values || res.embeddings?.[0]?.values || [];
        if (vec && vec.length > 0) return vec;
      } catch (err) {
        lastError = err;
        console.warn(`Gemini embedding error on ${candidate} (attempt ${attempt}/2): ${err.message}`);
        await sleep(attempt * 1000);
      }
    }
  }
  throw lastError;
}

/**
 * Extracts the first JSON object from a Gemini text response (stripping any
 * accidental markdown code fences).
 */
function extractJson(rawText) {
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in Gemini's response.");

  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    if (cleaned[i] === "}") depth--;
    if (depth === 0) {
      return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error("Unterminated JSON object in Gemini's response.");
}

module.exports = {
  ai,
  GEMINI_MODEL,
  generateWithRetry,
  embedContentWithRetry,
  extractJson,
};
