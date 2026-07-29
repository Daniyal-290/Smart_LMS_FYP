const { ai, GEMINI_MODEL } = require("./geminiClient");
const { fileToGeminiParts } = require("./fileContentService");

// ===================================================
// gradingService
// ===================================================
// Grades ONE submission against an assignment's rubric using Gemini.
// Handles all three submission forms: typed text, uploaded image/PDF
// (e.g. scanned handwritten math), and uploaded code/docx. A submission
// can have content AND a file — both are sent if present.
//
// Returns the raw grading result — it does NOT write to the database.
// Callers decide where the result goes (pendingAiGrade for a fresh
// grade/regrade, or copied to aiGrade on publish).

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

function buildRubricText(assignment) {
  const criteria = assignment.rubric?.criteria || [];

  if (criteria.length === 0) {
    return `No detailed rubric was provided. Grade holistically out of ${assignment.totalPoints} points, considering correctness, completeness, and clarity.`;
  }

  return criteria
    .map((c, i) => `${i + 1}. ${c.name} (${c.maxPoints} pts) — ${c.description}`)
    .join("\n");
}

/**
 * @param {object} submission - Mongoose Submission document
 * @param {object} assignment - Mongoose Assignment document (needs rubric + totalPoints + title)
 * @param {Array}  assignmentContextParts - optional Gemini parts from the assignment's own attached file
 * @returns {Promise<{ totalScore:number, maxScore:number, criteriaBreakdown:Array, overallFeedback:string }>}
 */
async function gradeSubmission(submission, assignment, assignmentContextParts = []) {
  const parts = [];

  if (assignmentContextParts.length > 0) {
    parts.push({ text: "Original assignment file (for context on what was asked):" }, ...assignmentContextParts);
  }

  if (submission.content && submission.content.trim()) {
    parts.push({ text: `Student's typed submission:\n${submission.content}` });
  }

  if (submission.fileUrl) {
    const fileParts = await fileToGeminiParts(submission.fileUrl, submission.originalFileName);
    parts.push({ text: "Student's uploaded file:" }, ...fileParts);
  }

  const hasSubmissionContent = parts.length > (assignmentContextParts.length > 0 ? 1 : 0);
  if (!hasSubmissionContent) {
    throw new Error("Submission has no content or file to grade.");
  }

  const rubricText = buildRubricText(assignment);

  const instruction = `You are an AI teaching assistant grading a student's assignment submission for "${assignment.title}".

Grading rubric (total ${assignment.totalPoints} points):
${rubricText}

Evaluate the student's submission against each rubric criterion. Be fair and consistent with other students.
If the submission is handwritten or an image, read it carefully before grading — including any math work shown.
If the submission is code, check correctness and logic, not just style.

Respond with ONLY a JSON object in this EXACT shape, no markdown or commentary:

{
  "totalScore": <number>,
  "maxScore": ${assignment.totalPoints},
  "criteriaBreakdown": [
    { "criterion": "<name>", "score": <number>, "maxScore": <number>, "feedback": "<1-2 sentence justification>" }
  ],
  "overallFeedback": "<3-5 sentences of constructive overall feedback for the student>"
}`;

  const responseSchema = {
    type: "object",
    properties: {
      totalScore: { type: "number" },
      maxScore: { type: "number" },
      criteriaBreakdown: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criterion: { type: "string" },
            score: { type: "number" },
            maxScore: { type: "number" },
            feedback: { type: "string" },
          },
          required: ["criterion", "score", "maxScore", "feedback"],
        },
      },
      overallFeedback: { type: "string" },
    },
    required: ["totalScore", "maxScore", "criteriaBreakdown", "overallFeedback"],
  };

  const callGemini = () =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: instruction }, ...parts] }],
      config: { responseMimeType: "application/json", responseSchema },
    });

  let response = await callGemini();
  let parsed;

  try {
    parsed = extractJson(response.text);
  } catch (err) {
    console.warn(`Retrying Gemini grading call after parse failure: ${err.message}`);
    response = await callGemini();
    parsed = extractJson(response.text);
  }

  if (typeof parsed.totalScore !== "number") {
    throw new Error("Gemini did not return a usable grade for this submission.");
  }

  return parsed;
}

module.exports = { gradeSubmission };
