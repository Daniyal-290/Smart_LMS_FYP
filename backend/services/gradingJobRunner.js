const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const GradingJob = require("../models/GradingJob");
const { parseRubricFromFile } = require("./rubricService");
const { gradeSubmission } = require("./gradingService");
const { fileToGeminiParts } = require("./fileContentService");

// ===================================================
// gradingJobRunner
// ===================================================
// Runs a full "Autograde" pass for an assignment in the background,
// independent of the HTTP request that triggered it. The controller
// creates the GradingJob and responds immediately; this module does
// the actual work and updates that same job document as it goes.
//
// IMPORTANT: results are written to pendingAiGrade/pendingAiFeedback,
// NOT aiGrade/aiFeedback. Nothing here is visible to a student until
// the teacher explicitly publishes it (see gradingController.publish*).
//
// Concurrency: submissions are processed in small chunks to stay
// within Gemini rate limits while still being reasonably fast at scale.

const CONCURRENCY = 5;

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatFeedback(result) {
  const lines = result.criteriaBreakdown.map(
    (c) => `• ${c.criterion} (${c.score}/${c.maxScore}): ${c.feedback}`
  );
  return `${lines.join("\n")}\n\nOverall: ${result.overallFeedback}`;
}

/**
 * Starts a job. Returns the created GradingJob immediately (status "queued");
 * the actual grading work continues after this function returns.
 *
 * @param {object} assignment - Mongoose Assignment document
 * @param {object} rubricFile - { fileUrl, originalFileName } for the rubric just uploaded
 * @param {boolean} regrade - if true, re-grades submissions that already have a published grade
 */
async function startAutogradeJob(assignment, rubricFile, regrade = false) {
  const filter = { assignment: assignment._id };
  if (!regrade) filter.aiGrade = null; // only ungraded (published) submissions by default

  const submissionCount = await Submission.countDocuments(filter);

  const job = await GradingJob.create({
    assignment: assignment._id,
    status: "queued",
    totalCount: submissionCount,
  });

  // Fire and forget — the controller responds to the teacher right
  // after this call returns; this keeps running server-side.
  runJob(job._id, assignment._id, rubricFile, filter).catch((err) => {
    console.error(`Grading job ${job._id} crashed unexpectedly:`, err);
  });

  return job;
}

async function runJob(jobId, assignmentId, rubricFile, submissionFilter) {
  const job = await GradingJob.findById(jobId);
  const assignment = await Assignment.findById(assignmentId);

  try {
    job.status = "in_progress";
    job.startedAt = new Date();
    await job.save();

    // Step 1: parse the rubric ONCE, save it on the assignment for reuse.
    const { criteria } = await parseRubricFromFile(
      rubricFile.fileUrl,
      rubricFile.originalFileName,
      assignment.totalPoints
    );
    assignment.rubricFileUrl = rubricFile.fileUrl;
    assignment.rubricOriginalFileName = rubricFile.originalFileName;
    assignment.rubric = { criteria };
    await assignment.save();

    // Step 2: read the assignment's own attached file ONCE, if present.
    let assignmentContextParts = [];
    if (assignment.attachmentUrl) {
      try {
        assignmentContextParts = await fileToGeminiParts(
          assignment.attachmentUrl,
          assignment.originalFileName
        );
      } catch (err) {
        console.warn(`Assignment file skipped for context (job ${jobId}):`, err.message);
      }
    }

    // Step 3: grade submissions in concurrency-limited chunks.
    const submissions = await Submission.find(submissionFilter);
    const chunks = chunk(submissions, CONCURRENCY);

    for (let i = 0; i < chunks.length; i++) {
      const batch = chunks[i];
      await Promise.all(
        batch.map(async (submission) => {
          try {
            const result = await gradeSubmission(submission, assignment, assignmentContextParts);

            // Draft only — teacher must explicitly publish before a
            // student can see this.
            submission.pendingAiGrade = result.totalScore;
            submission.pendingAiFeedback = formatFeedback(result);
            await submission.save();

            job.gradedCount += 1;
          } catch (err) {
            job.failedCount += 1;
            job.gradingErrors.push({ submission: submission._id, message: err.message });
          }
        })
      );

      await job.save();

      // Pause 4 seconds between chunks (except after final chunk) to stay under 15 RPM free tier rate limit
      if (i < chunks.length - 1) {
        await sleep(4000);
      }
    }

    job.status = "completed";
    job.completedAt = new Date();
    await job.save();
  } catch (err) {
    console.error(`Grading job ${jobId} failed before grading began:`, err.message);
    job.status = "failed";
    job.failureReason = err.message;
    job.completedAt = new Date();
    await job.save();
  }
}

module.exports = { startAutogradeJob };
