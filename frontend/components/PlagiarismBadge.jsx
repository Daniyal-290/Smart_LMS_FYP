"use client";

import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import "./PlagiarismModal.css";

export default function PlagiarismBadge({ submission, onClick }) {
  const report = submission?.plagiarismReport;
  const hasChecked = Boolean(report?.checkedAt || submission?.similarityScore !== undefined);
  const score = report?.highestSimilarityScore ?? submission?.similarityScore ?? 0;
  const isFlagged = report?.isFlagged || score >= 75;

  let badgeClass = "plagiarism-badge-btn plagiarism-badge-gray";
  let label = "Not Checked";
  let icon = <Shield size={13} />;

  if (hasChecked) {
    if (isFlagged || score >= 75) {
      badgeClass = "plagiarism-badge-btn plagiarism-badge-red";
      label = "Plagiarised";
      icon = <ShieldAlert size={13} />;
    } else {
      badgeClass = "plagiarism-badge-btn plagiarism-badge-green";
      label = "Original";
      icon = <ShieldCheck size={13} />;
    }
  }

  return (
    <button
      type="button"
      className={badgeClass}
      onClick={onClick}
      title="Click to view internal plagiarism report"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

