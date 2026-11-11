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
  const isFlagged = report.isFlagged || report.highestSimilarityScore >= 75;

  const getTagClass = (type) => {
    switch (type) {
      case "Direct Copy":
        return "plag-tag-pill plag-tag-direct";
      case "Paraphrased":
        return "plag-tag-pill plag-tag-paraphrased";
      case "Identical Math Errors/Steps":
        return "plag-tag-pill plag-tag-math";
      default:
        return "plag-tag-pill plag-tag-safe";
    }
  };

  const matchedStudentName =
    currentMatch?.matchedStudentId?.name || "Classmate";
  const matchedStudentId =
    currentMatch?.matchedStudentId?.enrollmentId || "";
  const matchScore =
    currentMatch?.aiVerifiedScore ??
    Math.round((currentMatch?.cosineSimilarity || 0) * 100);

  const studentCleanedText =
    submission.cleanedAnswerText ||
    submission.content ||
    "(No text answers extracted)";

  const matchedCleanedText =
    currentMatch?.matchedSubmissionId?.cleanedAnswerText ||
    currentMatch?.matchedSubmissionId?.content ||
    "(Classmate answer text not available)";

  return (
    <div className="plag-modal-overlay" onClick={onClose}>
      <div className="plag-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="plag-modal-header">
          <div>
            <h2 className="plag-modal-title">
              {isFlagged ? (
                <ShieldAlert size={24} color="#ef4444" />
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
              <span className="plag-summary-label">Result</span>
              <span
                className="plag-summary-val"
                style={{
                  color: isFlagged ? "#dc2626" : "#059669",
                }}
              >
                {isFlagged ? "Plagiarised" : "Original"}
              </span>
            </div>

            <div className="plag-summary-item">
              <span className="plag-summary-label">Status</span>
              <span className="plag-summary-val">
                {isFlagged ? "⚠️ Plagiarised (Above 75% threshold)" : "✅ Original"}
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
                  const isPeerPlagiarised = (m.aiVerifiedScore ?? Math.round((m.cosineSimilarity || 0) * 100)) >= 75;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`plag-peer-tab ${selectedMatchIdx === idx ? "active" : ""}`}
                      onClick={() => setSelectedMatchIdx(idx)}
                    >
                      <User size={14} />
                      {sName} · {isPeerPlagiarised ? "Plagiarised" : "Original"}
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
              <div className={`plag-reasoning-box ${matchScore >= 75 ? "alert" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div className="plag-reasoning-title">
                    {matchScore >= 75 ? <AlertTriangle size={16} color="#ef4444" /> : <Info size={16} color="#3b82f6" />}
                    Comparison with {matchedStudentName} ({matchedStudentId || "ID unavailable"})
                  </div>
                  <span className={getTagClass(currentMatch.flaggedType)}>
                    {currentMatch.flaggedType || (matchScore >= 75 ? "Plagiarised" : "Original")}
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
