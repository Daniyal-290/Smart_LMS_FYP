const { ai, GEMINI_MODEL } = require("./geminiClient");
const { fileToGeminiParts } = require("./fileContentService");

// ===================================================
// rubricService
// ===================================================
// Takes a rubric file a teacher uploaded (docx/pdf/image of a
// rubric table, etc.) and asks Gemini to turn it into a
// structured criteria list we can store on the Assignment and
// reuse for every submission we grade — so we only ever parse
// the rubric file once, not on every grading run.

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
 * @param {string} fileUrl - stored path, e.g. "/uploads/xyz.docx"
 * @param {string} originalFileName - original name, used to detect file type
 * @param {number} totalPoints - the assignment's totalPoints, given as context
 * @returns {Promise<{criteria: Array<{name:string, description:string, maxPoints:number}>}>}
 */
async function parseRubricFromFile(fileUrl, originalFileName, totalPoints) {
  const fileParts = await fileToGeminiParts(fileUrl, originalFileName);

  const instruction = `You are helping set up an auto-grading system for a Learning Management System.
The attached file is a grading rubric a teacher uploaded for an assignment worth ${totalPoints} total points.

Read the rubric and convert it into a structured JSON object with this EXACT shape and nothing else
(no markdown, no commentary, no code fences):

{
  "criteria": [
    { "name": "<short criterion name>", "description": "<what this criterion checks for>", "maxPoints": <number> }
  ]
}

Rules:
- Include every distinct criterion you find in the rubric.
- "maxPoints" values should add up to approximately ${totalPoints} (adjust proportionally if the rubric uses different point totals).
- If the file has no clear rubric structure, do your best to infer reasonable criteria from any grading guidance present.
- Respond with ONLY the JSON object.`;

  const responseSchema = {
    type: "object",
    properties: {
      criteria: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            maxPoints: { type: "number" },
          },
          required: ["name", "description", "maxPoints"],
        },
      },
    },
    required: ["criteria"],
  };

  const callGemini = () =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: instruction }, ...fileParts] }],
      config: { responseMimeType: "application/json", responseSchema },
    });

  let response = await callGemini();
  let parsed;

  try {
    parsed = extractJson(response.text);
  } catch (err) {
    console.warn(`Retrying Gemini rubric parse after failure: ${err.message}`);
    response = await callGemini();
    parsed = extractJson(response.text);
  }

  if (!parsed || !Array.isArray(parsed.criteria) || parsed.criteria.length === 0) {
    throw new Error("Gemini did not return usable rubric criteria. Try a clearer rubric file.");
  }

  return parsed;
}

module.exports = { parseRubricFromFile };
