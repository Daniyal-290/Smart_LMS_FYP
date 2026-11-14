"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  X,
  User,
  Scale,
  FileText,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import "./PlagiarismModal.css";

export default function PlagiarismModal({ submission, onClose }) {
  const report = submission?.plagiarismReport || {
    isFlagged: false,
    highestSimilarityScore: 0,
    matchedSubmissions: [],
  };

  const matches = report.matchedSubmissions || [];
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);

  if (!submission) return null;

  const currentMatch = matches[selectedMatchIdx] || null;
  const highestScore = Math.round(
    report.highestSimilarityScore ?? submission.similarityScore ?? 0
  );
  const isFlagged = report.isFlagged || highestScore >= 75;
  const isModerate = !isFlagged && highestScore >= 50;

  const currentMatchScore = Math.round(
    Math.max(
      currentMatch?.aiVerifiedScore || 0,
      (currentMatch?.cosineSimilarity || 0) * 100
    )
  );

  const getTagClass = (type, score) => {
    if (score >= 75) {
      return "plag-tag-pill plag-tag-direct";
    }
    if (score >= 50) {
      if (type === "Paraphrased") return "plag-tag-pill plag-tag-paraphrased";
      return "plag-tag-pill plag-tag-moderate";
    }
    if (type === "Identical Math Errors/Steps") return "plag-tag-pill plag-tag-math";
    return "plag-tag-pill plag-tag-safe";
  };

  const getDisplayTag = (match) => {
    if (!match) return "Safe";
    const score = Math.round(
      Math.max(match.aiVerifiedScore || 0, (match.cosineSimilarity || 0) * 100)
    );
    let type = match.flaggedType || "Safe";
    if (score >= 75 && type === "Safe") {
      type = "Plagiarism Detected";
    } else if (score >= 50 && type === "Safe") {
      type = "Moderate Similarity";
    }
    return `${type} (${score}%)`;
  };

  const matchedStudentName =
    currentMatch?.matchedStudentId?.name || "Classmate";
  const matchedStudentId =
    currentMatch?.matchedStudentId?.enrollmentId || "";

  const studentCleanedText =
    submission.cleanedAnswerText ||
    submission.content ||
    "(No text answers extracted)";

  const matchedCleanedText =
    currentMatch?.matchedSubmissionId?.cleanedAnswerText ||
    currentMatch?.matchedSubmissionId?.content ||
    "(Classmate answer text not available)";

  const reasoningClass =
    currentMatchScore >= 75
      ? "plag-reasoning-box alert"
      : currentMatchScore >= 50
      ? "plag-reasoning-box moderate"
      : "plag-reasoning-box";

  return (
    <div className="plag-modal-overlay" onClick={onClose}>
      <div className="plag-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="plag-modal-header">
          <div>
            <h2 className="plag-modal-title">
              {isFlagged ? (
                <ShieldAlert size={24} color="#ef4444" />
              ) : isModerate ? (
                <AlertCircle size={24} color="#f59e0b" />
              ) : (
                <ShieldCheck size={24} color="#10b981" />
              )}
              Internal Plagiarism Report
            </h2>
            <p className="plag-modal-subtitle">
              Student: {submission.student?.name} ({submission.student?.enrollmentId || "N/A"}) · Assignment: {submission.assignment?.title || "Assignment"}
            </p>
          </div>
          <button className="plag-close-btn" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="plag-modal-body">
          {/* Summary Row */}
          <div className="plag-summary-card">
            <div className="plag-summary-item">
              <span className="plag-summary-label">Highest Similarity</span>
              <span
                className="plag-summary-val"
                style={{
                  color: isFlagged ? "#dc2626" : isModerate ? "#b45309" : "#059669",
                }}
              >
                {isFlagged
                  ? `Plagiarism Detected (${highestScore}%)`
                  : isModerate
                  ? `Moderate Similarity (${highestScore}%)`
                  : `Original (${highestScore}%)`}
              </span>
            </div>

            <div className="plag-summary-item">
              <span className="plag-summary-label">Status</span>
              <span className="plag-summary-val">
                {isFlagged
                  ? "🔴 Plagiarism Detected (≥ 75%)"
                  : isModerate
                  ? "🟡 Moderate Similarity (50% - 74%)"
                  : "🟢 Original (< 50%)"}
              </span>
            </div>

            <div className="plag-summary-item">
              <span className="plag-summary-label">Cohort Comparisons</span>
              <span className="plag-summary-val">
                {matches.length} classmate comparison(s)
              </span>
            </div>

            {report.checkedAt && (
              <div className="plag-summary-item">
                <span className="plag-summary-label">Evaluated At</span>
                <span className="plag-summary-val" style={{ fontSize: "13px", fontWeight: "500" }}>
                  {new Date(report.checkedAt).toLocaleDateString()} {new Date(report.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>

          {/* Match selector if multiple matches exist */}
          {matches.length > 1 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
                Select Matched Classmate:
              </div>
              <div className="plag-peer-selector">
                {matches.map((m, idx) => {
                  const sName = m.matchedStudentId?.name || `Classmate ${idx + 1}`;
                  const pScore = Math.round(
                    Math.max(m.aiVerifiedScore || 0, (m.cosineSimilarity || 0) * 100)
                  );
                  let tierText = `Original (${pScore}%)`;
                  if (pScore >= 75) {
                    tierText = `Plagiarised (${pScore}%)`;
                  } else if (pScore >= 50) {
                    tierText = `Moderate (${pScore}%)`;
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`plag-peer-tab ${selectedMatchIdx === idx ? "active" : ""}`}
                      onClick={() => setSelectedMatchIdx(idx)}
                    >
                      <User size={14} />
                      {sName} · {tierText}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Match Detail Card */}
          {currentMatch ? (
            <>
              {/* Reasoning & Type Banner */}
              <div className={reasoningClass}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div className="plag-reasoning-title">
                    {currentMatchScore >= 75 ? (
                      <AlertTriangle size={16} color="#ef4444" />
                    ) : currentMatchScore >= 50 ? (
                      <AlertCircle size={16} color="#f59e0b" />
                    ) : (
                      <Info size={16} color="#3b82f6" />
                    )}
                    Comparison with {matchedStudentName} ({matchedStudentId || "ID unavailable"})
                  </div>
                  <span className={getTagClass(currentMatch.flaggedType, currentMatchScore)}>
                    {getDisplayTag(currentMatch)}
                  </span>
                </div>
                <p className="plag-reasoning-text">
                  <strong>AI Analysis:</strong> {currentMatch.reasoning || "Standard comparison completed."}
                </p>
                {currentMatch.cosineSimilarity !== undefined && (
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    Raw Vector Cosine Similarity: {(currentMatch.cosineSimilarity * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Side-by-Side Comparison */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Scale size={16} />
                  Side-by-Side Cleaned Answers Comparison (Questions & Boilerplate Stripped)
                </div>
                <div className="plag-comparison-grid">
                  {/* Left Pane: Current Student */}
                  <div className="plag-pane">
                    <div className="plag-pane-header">
                      <div>
                        <div className="plag-pane-student">{submission.student?.name} (Current)</div>
                        <div className="plag-pane-id">{submission.student?.enrollmentId || ""}</div>
                      </div>
                      <FileText size={16} color="#64748b" />
                    </div>
                    <div className="plag-pane-content">
                      {studentCleanedText}
                    </div>
                  </div>

                  {/* Right Pane: Matched Student */}
                  <div className="plag-pane">
                    <div className="plag-pane-header">
                      <div>
                        <div className="plag-pane-student">{matchedStudentName} (Comparison)</div>
                        <div className="plag-pane-id">{matchedStudentId}</div>
                      </div>
                      <FileText size={16} color="#64748b" />
                    </div>
                    <div className="plag-pane-content">
                      {matchedCleanedText}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="plag-reasoning-box">
              <div className="plag-reasoning-title">
                <ShieldCheck size={18} color="#10b981" />
                No Significant Peer Similarity Found
              </div>
              <p className="plag-reasoning-text">
                This student&apos;s submission shows high originality against all other submitted assignments in this cohort.
              </p>
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Cleaned Student Answers:
                </div>
                <div className="plag-pane-content" style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  {studentCleanedText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="plag-modal-footer">
          <button type="button" className="plag-btn-close" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
