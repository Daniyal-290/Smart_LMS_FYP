"use client";

import {
  Brain,
  FileCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2,
} from "lucide-react";
import { useFacultyOverview } from "../../../hooks/useFacultyOverview";

export default function AutoGrading() {
  const { assignments, submissions, loading, error } = useFacultyOverview();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 size={20} className="animate-spin" />
        Loading grading data...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-24 text-red-500">Error: {error}</div>;
  }

  const gradedAssignments = assignments.filter(
    (a) => a.publishedCount > 0 || a.pendingReviewCount > 0
  );

  const totalSubmissions = submissions.length;
  const totalAiGraded = submissions.filter(
    (s) =>
      (s.aiGrade !== null && s.aiGrade !== undefined) ||
      (s.pendingAiGrade !== null && s.pendingAiGrade !== undefined)
  ).length;
  const totalPendingReview = submissions.filter(
    (s) =>
      (s.aiGrade === null || s.aiGrade === undefined) &&
      s.pendingAiGrade !== null &&
      s.pendingAiGrade !== undefined
  ).length;
  const totalPublished = submissions.filter((s) => s.aiGrade !== null && s.aiGrade !== undefined).length;

  // Honest metric: what fraction of AI-graded work has actually been
  // reviewed and published by the teacher — not a fabricated "accuracy"
  // number, since we have no independent ground truth to compare against.
  const publishedRate = totalAiGraded > 0 ? ((totalPublished / totalAiGraded) * 100).toFixed(1) : "0.0";

  const classAverage =
    totalPublished > 0
      ? (
          submissions
            .filter((s) => s.aiGrade !== null && s.aiGrade !== undefined)
            .reduce((sum, s) => sum + (s.aiGrade / (s.assignment?.totalPoints || 100)) * 100, 0) / totalPublished
        ).toFixed(1)
      : null;

  const insights = [];
  if (totalPendingReview > 0) {
    insights.push({
      icon: <Info size={16} className="text-amber-500" />,
      text: `${totalPendingReview} submission${totalPendingReview !== 1 ? "s" : ""} graded by AI and awaiting your review.`,
    });
  }
  const lowest = gradedAssignments
    .filter((a) => a.avgPublishedScore !== null)
    .sort((a, b) => a.avgPublishedScore / a.totalPoints - b.avgPublishedScore / b.totalPoints)[0];
  if (lowest) {
    insights.push({
      icon: <TrendingDown size={16} className="text-red-500" />,
      text: `"${lowest.title}" has the lowest published average (${((lowest.avgPublishedScore / lowest.totalPoints) * 100).toFixed(1)}%).`,
    });
  }
  const ungradedAssignments = assignments.filter((a) => a.submittedCount > 0 && a.publishedCount === 0 && a.pendingReviewCount === 0);
  if (ungradedAssignments.length > 0) {
    insights.push({
      icon: <TrendingUp size={16} className="text-emerald-500" />,
      text: `${ungradedAssignments.length} assignment${ungradedAssignments.length !== 1 ? "s have" : " has"} submissions but haven't been autograded yet.`,
    });
  }
  if (insights.length === 0) {
    insights.push({
      icon: <Info size={16} className="text-slate-400" />,
      text: "No grading activity yet — run Autograde on an assignment to see insights here.",
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">AI Auto Grading</h1>
        <p className="text-slate-500 mt-2">AI-powered grading results and insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<FileCheck size={22} />} title="AI Graded" value={totalAiGraded} sub={`of ${totalSubmissions} total submissions`} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<Brain size={22} />} title="Class Average" value={classAverage !== null ? `${classAverage}%` : "—"} sub="Published grades only" accent="bg-slate-100 text-slate-700" />
        <StatCard icon={<AlertCircle size={22} />} title="Pending Review" value={totalPendingReview} sub="Awaiting publish" accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<TrendingUp size={22} />} title="Published Rate" value={`${publishedRate}%`} sub="Of all AI-graded work" accent="bg-slate-100 text-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Grading Results</h2>

          {gradedAssignments.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No assignments have been autograded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-sm font-semibold text-slate-500">Assignment</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">AI Graded</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Pending Review</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Avg Score</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {gradedAssignments.map((a) => {
                    const aiGradedCount = a.publishedCount + a.pendingReviewCount;
                    const avgPct = a.avgPublishedScore !== null ? ((a.avgPublishedScore / a.totalPoints) * 100).toFixed(1) : null;
                    const publishedPct = aiGradedCount > 0 ? Math.round((a.publishedCount / aiGradedCount) * 100) : 0;

                    return (
                      <tr key={a._id} className="border-b border-slate-100 last:border-0">
                        <td className="py-4 font-medium text-slate-800">{a.title}</td>
                        <td className="py-4 text-slate-600 text-sm">{a.courseTitle}</td>
                        <td className="py-4 text-slate-700 font-medium">{aiGradedCount}/{a.submittedCount}</td>
                        <td className="py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${a.pendingReviewCount > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {a.pendingReviewCount}
                          </span>
                        </td>
                        <td className="py-4 text-slate-700 font-medium">{avgPct !== null ? `${avgPct}%` : "—"}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-20">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${publishedPct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{publishedPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Recent Insights</h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700">
                <span className="mt-0.5 shrink-0">{insight.icon}</span>
                <span>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, sub, accent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${accent}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h2 className="text-3xl font-bold text-slate-800">{value}</h2>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
