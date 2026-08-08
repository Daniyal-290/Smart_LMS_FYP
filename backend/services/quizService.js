const { ai, GEMINI_MODEL } = require("./geminiClient");
const { fileToGeminiParts } = require("./fileContentService");

// ===================================================
// quizService
// ===================================================
// Generates self-assessment practice quizzes from lecture files using Gemini.
// Dynamically adjusts question count based on lecture document length/detail.

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

/**
 * Generates a practice quiz for a given lecture file.
 * @param {object} lecture - Mongoose Lecture document
 * @returns {Promise<{ questions: Array<{ questionText: string, options: Array<string>, correctOptionIndex: number, explanation: string }> }>}
 */
async function generateQuizFromLecture(lecture) {
  const fileParts = await fileToGeminiParts(lecture.fileUrl, lecture.originalFileName);

  const promptText = `You are an expert university professor creating a practice quiz for students based on the attached lecture document titled "${lecture.title}".

This quiz is strictly for student self-learning and practice.

INSTRUCTIONS FOR QUESTION COUNT:
1. Examine the overall length, word count, topic breadth, and page/slide count of the attached document.
2. Determine the appropriate number of Multiple Choice Questions (MCQs):
   - Short/concise lecture (1-5 pages or <1,000 words): Generate 5 to 10 MCQs.
   - Medium lecture (6-20 pages or 1,000-3,500 words): Generate 10 to 20 MCQs.
   - Extensive/Long lecture (20+ pages / ~50 slides / >3,500 words): Generate 20 to 30 MCQs to thoroughly cover every major concept.
3. Every question must have:
   - "questionText": Clear, unambiguous question.
   - "options": Array of EXACTLY 4 plausible answer choices (A, B, C, D).
   - "correctOptionIndex": Integer from 0 to 3 indicating the correct choice in the "options" array.
   - "explanation": 1-2 sentences explaining why the correct choice is right and helping the student learn.

Respond with ONLY a JSON object in this EXACT structure (no markdown, no surrounding text):
{
  "questions": [
    {
      "questionText": "<question text>",
      "options": ["<option 0>", "<option 1>", "<option 2>", "<option 3>"],
      "correctOptionIndex": 0,
      "explanation": "<brief explanation>"
    }
  ]
}`;

  const responseSchema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionText: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
            },
            correctOptionIndex: { type: "number" },
            explanation: { type: "string" },
          },
          required: ["questionText", "options", "correctOptionIndex", "explanation"],
        },
      },
    },
    required: ["questions"],
  };

  const callGemini = () =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: promptText }, ...fileParts] }],
      config: { responseMimeType: "application/json", responseSchema },
    });

  let response = await callGemini();
  let parsed;

  try {
    parsed = extractJson(response.text);
  } catch (err) {
    console.warn(`Retrying Gemini quiz generation after JSON parse error: ${err.message}`);
    response = await callGemini();
    parsed = extractJson(response.text);
  }

  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Gemini did not return usable quiz questions from this lecture document.");
  }

  // Sanitize questions
  const validQuestions = parsed.questions
    .filter(
      (q) =>
        q.questionText &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctOptionIndex === "number" &&
        q.correctOptionIndex >= 0 &&
        q.correctOptionIndex <= 3
    )
    .map((q) => ({
      questionText: q.questionText.trim(),
      options: q.options.map((o) => o.trim()),
      correctOptionIndex: Math.floor(q.correctOptionIndex),
      explanation: q.explanation ? q.explanation.trim() : "Review lecture materials for details.",
    }));

  if (validQuestions.length === 0) {
    throw new Error("Failed to format quiz questions properly.");
  }

  return { questions: validQuestions };
}

module.exports = { generateQuizFromLecture };
