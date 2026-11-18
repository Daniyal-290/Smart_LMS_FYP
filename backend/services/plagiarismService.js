const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const {
  ai,
  GEMINI_MODEL,
  generateWithRetry,
  embedContentWithRetry,
  extractJson,
} = require("./geminiClient");
const { resolveUploadPath, fileToGeminiParts, getFileBuffer } = require("./fileContentService");

// ===================================================
// Cosine Similarity Utility
// ===================================================
// Compares two vector arrays. Returns float between -1.0 and 1.0 (typically 0.0 to 1.0).
function cosineSimilarity(vecA, vecB) {
  if (
    !Array.isArray(vecA) ||
    !Array.isArray(vecB) ||
    vecA.length === 0 ||
    vecB.length === 0 ||
    vecA.length !== vecB.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
}

// ===================================================
// Step 0: Extract Raw Text from Submission
// ===================================================
// Pulls student text from typed content, docx, txt/code, pptx, or PDF.
async function extractRawSubmissionText(submission) {
  let text = (submission.content || "").trim();

  if (!submission.fileUrl) {
    return text;
  }

  try {
    const fileBuffer = await getFileBuffer(submission.fileUrl);
    if (!fileBuffer) {
      return text;
    }

    const ext = path.extname(submission.originalFileName || submission.fileUrl).toLowerCase();

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const docxText = (result.value || "").trim();
      text = text ? `${text}\n\n${docxText}` : docxText;
    } else if (
      [".txt", ".md", ".json", ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".cs", ".html", ".css"].includes(ext)
    ) {
      const fileText = fileBuffer.toString("utf-8").trim();
      text = text ? `${text}\n\n${fileText}` : fileText;
    } else if (ext === ".pptx" || ext === ".ppt") {
      try {
        const { OfficeParser, parseOffice } = require("officeparser");
        const fn = OfficeParser && typeof OfficeParser.parseOffice === "function" ? OfficeParser.parseOffice : parseOffice;
        if (fn) {
          const ast = await fn(fileBuffer);
          const pptText = typeof ast === "string" ? ast : ast && typeof ast.toText === "function" ? ast.toText() : "";
          if (pptText && pptText.trim()) {
            text = text ? `${text}\n\n${pptText.trim()}` : pptText.trim();
          }
        }
      } catch (err) {
        console.warn("officeparser extraction warning in plagiarism check:", err.message);
      }
    } else if (ext === ".pdf" || [".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      // For PDF / scanned documents, ask Gemini Flash to transcribe the text
      try {
        const fileParts = await fileToGeminiParts(submission.fileUrl, submission.originalFileName);
        const transcribeRes = await generateWithRetry({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Extract and transcribe all the written text, answers, and mathematical formulas from this student's submission document into clean plain text. Do NOT add commentary.",
                },
                ...fileParts,
              ],
            },
          ],
        });
        const transcribed = (transcribeRes.text || "").trim();
        if (transcribed) {
          text = text ? `${text}\n\n${transcribed}` : transcribed;
        }
      } catch (pdfErr) {
        console.warn("PDF transcription warning in plagiarism check:", pdfErr.message);
      }
    }
  } catch (err) {
    console.warn("File text extraction warning:", err.message);
  }

  return text.trim();
}

// ===================================================
// Step 1: Question & Boilerplate Stripping
// ===================================================
// Local rule-based question & header stripping (fast fallback)
function localCleanText(rawText, assignment) {
  if (!rawText) return "";
  let text = rawText;

  // 1. Remove markdown code fences
  text = text.replace(/^```[a-z]*\n?/gim, "").replace(/\n?```$/gim, "");

  // 2. Remove standard student/assignment headers
  text = text.replace(/^(Name|Student Name|Roll No|Enrollment ID|Course|Instructor|Assignment|Date|Title):\s*[^\n]*$/gim, "");

  // 3. Remove question headers like "Question 1:", "Q1.", "Part (a):"
  text = text.replace(/^(Question\s*\d+|Q\d+|Part\s*\([a-z0-9]+\)|Problem\s*\d+):?\s*$/gim, "");

  // 4. Strip prompt text lines if present
  if (assignment?.prompt) {
    const promptLines = assignment.prompt.split("\n").map((l) => l.trim()).filter((l) => l.length > 20);
    for (const pLine of promptLines) {
      text = text.split(pLine).join("");
    }
  }

  return text.trim() || rawText.trim();
}

// Strips questions, headers (student name, roll no), and formatting noise.
async function stripBoilerplateAndQuestions(rawText, assignment) {
  if (!rawText || !rawText.trim()) {
    return "";
  }

  const fallback = localCleanText(rawText, assignment);

  const assignmentContext = [
    `Title: ${assignment.title || ""}`,
    assignment.prompt ? `Prompt/Questions: ${assignment.prompt}` : "",
    assignment.description ? `Description: ${assignment.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const instruction = `You are a preprocessing utility for an academic plagiarism detection system.
Students frequently copy-paste the teacher's original questions, instructions, and personal identification headers into their submitted document before writing their answers. This artificially inflates similarity scores across the class.

ORIGINAL ASSIGNMENT PROMPT / QUESTIONS:
"""
${assignmentContext}
"""

STUDENT RAW SUBMISSION TEXT:
"""
${rawText}
"""

TASK:
Extract and return ONLY the student's actual answers, solutions, mathematical derivations, essays, or code.

STRICT RULES:
1. Strip out all copy-pasted questions, question numbers, prompts, and assignment instructions.
2. Strip out student headers (e.g., student name, roll number, enrollment ID, instructor name, course code, university name, submission date, assignment title).
3. Strip out repetitive boilerplate formatting (e.g., "Assignment 1", "Question 1:", "Answer:").
4. PRESERVE the student's actual wording, answers, logic, steps, typos, phrasing, and mathematical steps exactly as written. Do NOT rephrase or summarize.
5. If the submission consists ONLY of the student's own answers without questions or headers, return it directly.
6. Return the cleaned answer text as plain text. Do NOT wrap in markdown code blocks or add introductory text.`;

  try {
    const res = await generateWithRetry({
      contents: [{ role: "user", parts: [{ text: instruction }] }],
    });

    let cleaned = (res.text || "").trim();
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    return cleaned || fallback;
  } catch (err) {
    console.warn("Question stripping fallback to local cleaned text:", err.message);
    return fallback;
  }
}

// ===================================================
// Step 2: Vector Embedding Generation
// ===================================================
async function generateSubmissionEmbedding(cleanedText) {
  if (!cleanedText || !cleanedText.trim()) {
    return [];
  }
  return await embedContentWithRetry(cleanedText);
}

// ===================================================
// Step 3: Hybrid Verification & Math Logic
// ===================================================
// When cosineSimilarity >= 0.50, run secondary AI verification check.
async function verifyPlagiarismWithAI(textA, textB, assignment, cosineVal) {
  const cosinePercent = Math.round(cosineVal * 100);

  const prompt = `You are a senior academic integrity reviewer and expert educator.
Compare two student submissions for the assignment titled "${assignment.title || "Assignment"}" to determine if unauthorized copying or paraphrasing occurred between them.

ASSIGNMENT CONTEXT / PROMPT:
${assignment.prompt || assignment.description || assignment.title || "Course Assignment"}

STUDENT A CLEANED SUBMISSION:
"""
${textA.slice(0, 4000)}
"""

STUDENT B CLEANED SUBMISSION:
"""
${textB.slice(0, 4000)}
"""

Cosine Vector Similarity: ${cosinePercent}%

CRITICAL INTEGRITY AND SIMILARITY EVALUATION RULES:
1. HIGH SIMILARITY (>= 75%):
   - A vector cosine similarity of 75% or higher indicates overwhelming lexical, semantic, and structural overlap.
   - You MUST NOT classify submissions with >= 75% cosine similarity as "Safe". Independent students writing their own answers do not reach 75%+ cosine similarity unless the answer is just a single trivial phrase.
   - If students share similar sentence flow, similar conceptual explanations, or similar illustrative examples (even for standard textbook topics such as database normalization, data structures, or networking), you MUST classify as "Paraphrased" or "Direct Copy".
   - Under no circumstances should a pair with >= 75% similarity be marked "Safe".

2. VERY HIGH SIMILARITY (>= 85%):
   - At >= 85% similarity, identical phrasing, structure, or verbatim copy-pasting/paraphrasing is virtually certain.
   - Classify as "Direct Copy" (or "Paraphrased" if systematically rewritten sentence-by-sentence) and calibrate the aiVerifiedScore to be at least ${cosinePercent}%.

3. MODERATE SIMILARITY (50% - 74%):
   - Normal overlap of standard definitions and terminology typically produces 50% - 74% similarity.
   - Classify as "Paraphrased" if there is clear structural copying or shared unique examples, or "Safe" if it is merely independent answers covering standard textbook points.

4. MATH / FORMULA QUESTIONS:
   - For purely computational steps, flag as "Identical Math Errors/Steps" if both students share matching arithmetic mistakes, identical wrong final answers, or idiosyncratic skipped steps.

5. Classification Categories:
   - "Direct Copy": Substantial word-for-word duplication or identical code/steps with trivial alterations.
   - "Paraphrased": Rewritten sentences retaining identical structural cadence, concept ordering, and unique analogies/arguments.
   - "Identical Math Errors/Steps": Matching numerical errors, wrong final values, or identical skipped derivation steps.
   - "Safe": Independent work, incidental similarity due to standard facts, common formulas, or coincidence (ONLY applicable when similarity is below 75%).

Respond with ONLY a JSON object in this EXACT shape:
{
  "aiVerifiedScore": <number between 0 and 100 representing calibrated confidence of plagiarism>,
  "flaggedType": "Direct Copy" | "Paraphrased" | "Identical Math Errors/Steps" | "Safe",
  "reasoning": "<1 clear, concise sentence explaining the finding>"
}`;

  const responseSchema = {
    type: "object",
    properties: {
      aiVerifiedScore: { type: "number" },
      flaggedType: {
        type: "string",
        enum: ["Direct Copy", "Paraphrased", "Identical Math Errors/Steps", "Safe"],
      },
      reasoning: { type: "string" },
    },
    required: ["aiVerifiedScore", "flaggedType", "reasoning"],
  };

  try {
    const response = await generateWithRetry({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", responseSchema },
    });

    const parsed = extractJson(response.text);
    let finalScore = Math.max(0, Math.min(100, Math.round(parsed.aiVerifiedScore || 0)));
    let finalType = parsed.flaggedType || "Safe";
    let reasoning = parsed.reasoning || "Similarity evaluated.";

    // Guardrail against AI leniency at exceptionally high vector similarities:
    // Check if the assignment is math/formula-heavy
    const isMathAssignment = /math|calculus|algebra|equation|differential|derivative|integral|formula/i.test(
      `${assignment?.title || ""} ${assignment?.prompt || ""}`
    );

    // If non-math assignment and vector similarity is high (>= 85%),
    // independent students do not write nearly-identical essays by accident.
    if (!isMathAssignment && cosinePercent >= 85) {
      finalScore = Math.max(75, Math.max(cosinePercent, finalScore));
      if (finalType === "Safe") {
        finalType = cosinePercent >= 92 ? "Direct Copy" : "Paraphrased";
        reasoning = `High vector similarity (${cosinePercent}%); extensive overlap in phrasing, structure, or illustrative examples detected.`;
      }
    } else if (!isMathAssignment && cosinePercent >= 75 && finalType === "Safe") {
      // If cosine >= 75% on theory and AI returned Safe, calibrate to Moderate (50-70%)
      finalScore = Math.max(50, Math.min(70, finalScore));
      finalType = "Paraphrased";
      reasoning = reasoning || `Substantial conceptual and structural overlap (${cosinePercent}%).`;
    }

    return {
      aiVerifiedScore: finalScore,
      flaggedType: finalType,
      reasoning: reasoning,
    };
  } catch (err) {
    console.warn("AI verification error, falling back to calibrated cosine baseline:", err.message);
    const fallbackScore = Math.min(100, Math.round(35 + ((cosineVal - 0.70) / 0.30) * 65));
    const fallbackType = fallbackScore >= 75 ? (cosinePercent >= 88 ? "Direct Copy" : "Paraphrased") : "Safe";
    return {
      aiVerifiedScore: fallbackScore,
      flaggedType: fallbackType,
      reasoning: `Vector similarity measured at ${cosinePercent}%.`,
    };
  }
}

// ===================================================
// Helper: Process and Ensure Cleaned Text & Embedding
// ===================================================
async function prepareSubmissionTextAndEmbedding(submission, assignment) {
  let modified = false;

  if (!submission.cleanedAnswerText) {
    const rawText = await extractRawSubmissionText(submission);
    if (rawText) {
      submission.cleanedAnswerText = await stripBoilerplateAndQuestions(rawText, assignment);
    } else {
      submission.cleanedAnswerText = "";
    }
    modified = true;
  }

  if (
    (!submission.embedding || submission.embedding.length === 0) &&
    submission.cleanedAnswerText &&
    submission.cleanedAnswerText.trim()
  ) {
    submission.embedding = await generateSubmissionEmbedding(submission.cleanedAnswerText);
    modified = true;
  }

  if (modified) {
    await submission.save();
  }

  return submission;
}

// ===================================================
// Step 4: Compare Two Submissions & Produce Match Object
// ===================================================
async function compareSubmissionPair(subA, subB, assignment) {
  const cosine = cosineSimilarity(subA.embedding, subB.embedding);
  const cosinePercent = Math.round(cosine * 100);

  // If cosine similarity is >= 0.70 (70%), run secondary AI verification check
  if (cosine >= 0.70) {
    try {
      const aiResult = await verifyPlagiarismWithAI(
        subA.cleanedAnswerText || "",
        subB.cleanedAnswerText || "",
        assignment,
        cosine
      );

      return {
        cosineSimilarity: cosine,
        aiVerifiedScore: aiResult.aiVerifiedScore,
        reasoning: aiResult.reasoning,
        flaggedType: aiResult.flaggedType,
      };
    } catch (err) {
      console.warn("AI pair comparison warning, using calibrated fallback:", err.message);
      const fallbackScore = Math.min(100, Math.round(35 + ((cosine - 0.70) / 0.30) * 65));
      const fallbackType = fallbackScore >= 75 ? (cosine >= 0.88 ? "Direct Copy" : "Paraphrased") : "Safe";
      return {
        cosineSimilarity: cosine,
        aiVerifiedScore: fallbackScore,
        reasoning: `Vector similarity measured at ${cosinePercent}%.`,
        flaggedType: fallbackType,
      };
    }
  }

  // Below 0.70: Independent student work with normal vocabulary overlap
  // Calibrate raw cosine (0.45 - 0.70) to clean 0% - 35% Original score:
  const baselineScore = Math.max(0, Math.min(35, Math.round(((cosine - 0.45) / 0.25) * 35)));
  return {
    cosineSimilarity: cosine,
    aiVerifiedScore: baselineScore,
    reasoning: "Independent submission with standard vocabulary overlap.",
    flaggedType: "Safe",
  };
}

// ===================================================
// Single Submission Plagiarism Check (e.g. on new submit)
// ===================================================
async function checkSingleSubmissionPlagiarism(submissionId, assignmentId) {
  const [submission, assignment] = await Promise.all([
    Submission.findById(submissionId),
    Assignment.findById(assignmentId),
  ]);

  if (!submission || !assignment) return null;

  await prepareSubmissionTextAndEmbedding(submission, assignment);

  // Fetch all other submissions for the same assignment
  const peerSubmissions = await Submission.find({
    assignment: assignmentId,
    _id: { $ne: submission._id },
  });

  if (!peerSubmissions.length || !submission.embedding || !submission.embedding.length) {
    submission.plagiarismReport = {
      isFlagged: false,
      highestSimilarityScore: 0,
      checkedAt: new Date(),
      matchedSubmissions: [],
    };
    submission.similarityScore = 0;
    submission.isFlagged = false;
    await submission.save();
    return submission;
  }

  const currentMatches = [];

  for (const peer of peerSubmissions) {
    await prepareSubmissionTextAndEmbedding(peer, assignment);

    if (!peer.embedding || !peer.embedding.length) continue;

    const pairResult = await compareSubmissionPair(submission, peer, assignment);

    // Record for current submission
    currentMatches.push({
      matchedStudentId: peer.student,
      matchedSubmissionId: peer._id,
      cosineSimilarity: pairResult.cosineSimilarity,
      aiVerifiedScore: pairResult.aiVerifiedScore,
      reasoning: pairResult.reasoning,
      flaggedType: pairResult.flaggedType,
    });

    // Bidirectionally update peer's report as well
    const peerMatches = (peer.plagiarismReport?.matchedSubmissions || []).filter(
      (m) => m.matchedSubmissionId?.toString() !== submission._id.toString()
    );

    peerMatches.push({
      matchedStudentId: submission.student,
      matchedSubmissionId: submission._id,
      cosineSimilarity: pairResult.cosineSimilarity,
      aiVerifiedScore: pairResult.aiVerifiedScore,
      reasoning: pairResult.reasoning,
      flaggedType: pairResult.flaggedType,
    });

    const peerHighest = peerMatches.reduce(
      (max, m) => Math.max(max, m.aiVerifiedScore || 0),
      0
    );

    peer.plagiarismReport = {
      isFlagged: peerHighest >= 75,
      highestSimilarityScore: peerHighest,
      checkedAt: new Date(),
      matchedSubmissions: peerMatches,
    };
    peer.similarityScore = peerHighest;
    peer.isFlagged = peerHighest >= 75;
    await peer.save();
  }

  const highestScore = currentMatches.reduce(
    (max, m) => Math.max(max, m.aiVerifiedScore || 0),
    0
  );

  submission.plagiarismReport = {
    isFlagged: highestScore >= 75,
    highestSimilarityScore: highestScore,
    checkedAt: new Date(),
    matchedSubmissions: currentMatches,
  };
  submission.similarityScore = highestScore;
  submission.isFlagged = highestScore >= 75;
  await submission.save();

  return submission;
}

// ===================================================
// Batch Plagiarism Check for an Entire Assignment
// ===================================================
async function runBatchPlagiarismCheck(assignmentId) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const submissions = await Submission.find({ assignment: assignmentId }).populate(
    "student",
    "name email enrollmentId"
  );

  if (submissions.length === 0) {
    return {
      message: "No submissions found to check.",
      totalChecked: 0,
      flaggedCount: 0,
      submissions: [],
    };
  }

  // Step 1 & 2: Ensure all submissions have cleanedAnswerText and embedding
  for (const sub of submissions) {
    await prepareSubmissionTextAndEmbedding(sub, assignment);
  }

  // Initialize match maps for each submission
  const matchMap = new Map();
  submissions.forEach((s) => {
    matchMap.set(s._id.toString(), []);
  });

  // Step 3: Compare all pairs (i, j) with i < j
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const subA = submissions[i];
      const subB = submissions[j];

      if (!subA.embedding?.length || !subB.embedding?.length) {
        continue;
      }

      const result = await compareSubmissionPair(subA, subB, assignment);

      // Record A -> B
      matchMap.get(subA._id.toString()).push({
        matchedStudentId: subB.student?._id || subB.student,
        matchedSubmissionId: subB._id,
        cosineSimilarity: result.cosineSimilarity,
        aiVerifiedScore: result.aiVerifiedScore,
        reasoning: result.reasoning,
        flaggedType: result.flaggedType,
      });

      // Record B -> A
      matchMap.get(subB._id.toString()).push({
        matchedStudentId: subA.student?._id || subA.student,
        matchedSubmissionId: subA._id,
        cosineSimilarity: result.cosineSimilarity,
        aiVerifiedScore: result.aiVerifiedScore,
        reasoning: result.reasoning,
        flaggedType: result.flaggedType,
      });
    }
  }

  // Step 4: Persist reports on each submission
  let flaggedCount = 0;
  for (const sub of submissions) {
    const matches = matchMap.get(sub._id.toString()) || [];
    const highest = matches.reduce(
      (max, m) => Math.max(max, m.aiVerifiedScore || 0),
      0
    );
    const isFlagged = highest >= 75;
    if (isFlagged) flaggedCount++;

    sub.plagiarismReport = {
      isFlagged,
      highestSimilarityScore: highest,
      checkedAt: new Date(),
      matchedSubmissions: matches,
    };
    sub.similarityScore = highest;
    sub.isFlagged = isFlagged;
    await sub.save();
  }

  // Return populated submissions for frontend display
  const updatedSubmissions = await Submission.find({ assignment: assignmentId })
    .populate("student", "name email enrollmentId")
    .populate("plagiarismReport.matchedSubmissions.matchedStudentId", "name email enrollmentId")
    .populate("plagiarismReport.matchedSubmissions.matchedSubmissionId", "cleanedAnswerText content originalFileName")
    .populate("assignment", "title totalPoints");

  return {
    message: `Plagiarism check completed for ${submissions.length} submission(s).`,
    totalChecked: submissions.length,
    flaggedCount,
    submissions: updatedSubmissions,
  };
}

module.exports = {
  cosineSimilarity,
  extractRawSubmissionText,
  stripBoilerplateAndQuestions,
  generateSubmissionEmbedding,
  verifyPlagiarismWithAI,
  checkSingleSubmissionPlagiarism,
  runBatchPlagiarismCheck,
};

