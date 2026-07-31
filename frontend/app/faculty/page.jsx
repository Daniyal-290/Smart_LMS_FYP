"use client";

import Link from "next/link";
import {
  Users,
  FileCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Brain,
  Construction,
  Loader2,
} from "lucide-react";
import { useFacultyOverview } from "../../hooks/useFacultyOverview";

export default function FacultyDashboard() {
  const { courses, assignments, submissions, loading, error } = useFacultyOverview();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 size={20} className="animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-24 text-red-500">Error loading dashboard: {error}</div>;
  }

  return (
    <div className="space-y-8">
      <StatGrid courses={courses} submissions={submissions} />
      <AssignmentTable assignments={assignments} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIGradingInsights assignments={assignments} submissions={submissions} />
        <ComingSoonPanel
          title="Similarity Flags"
          description="Plagiarism/similarity detection compares submissions within the LMS database. This module is planned but not yet implemented."
          linkHref="/faculty/plagiarism"
          linkLabel="All detections"
        />
      </div>
      <ComingSoonPanel
        title="Mid-Term Risk Roster"
        description="An at-risk student dashboard, surfacing students struggling based on grades and submission patterns, is planned but not yet implemented."
        linkHref="/faculty/mid-term-reports"
        linkLabel="View all"
        large
      />
    </div>
  );
}

function StatGrid({ courses, submissions }) {
  const totalStudents = new Set(
    courses.flatMap((c) => (c.students || []).map((s) => s._id))
  ).size;

  const totalSubmitted = submissions.length;

  const pendingReview = submissions.filter(
    (s) =>
      (s.aiGrade === null || s.aiGrade === undefined) &&
      s.pendingAiGrade !== null &&
      s.pendingAiGrade !== undefined
  ).length;

  const ungraded = submissions.filter(
    (s) =>
      (s.aiGrade === null || s.aiGrade === undefined) &&
      (s.pendingAiGrade === null || s.pendingAiGrade === undefined)
  ).length;

  const stats = [
    { title: "Total Students", value: totalStudents, icon: <Users size={22} />, accent: "bg-slate-100 text-slate-700" },
    { title: "Submitted Assignments", value: totalSubmitted, icon: <FileCheck size={22} />, accent: "bg-emerald-50 text-emerald-600" },
    { title: "Pending Review", value: pendingReview, icon: <Clock size={22} />, accent: "bg-amber-50 text-amber-600" },
    { title: "Ungraded", value: ungraded, icon: <AlertTriangle size={22} />, accent: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((s) => (
        <div key={s.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.accent}`}>{s.icon}</div>
            <div>
              <p className="text-sm text-slate-500">{s.title}</p>
              <h2 className="text-3xl font-bold text-slate-800">{s.value}</h2>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentTable({ assignments }) {
  const statusColor = {
    Graded: "bg-emerald-100 text-emerald-700",
    "Pending Review": "bg-amber-100 text-amber-700",
    Pending: "bg-amber-100 text-amber-700",
    Overdue: "bg-red-100 text-red-700",
    "No Submissions": "bg-slate-100 text-slate-500",
  };

  const recent = [...assignments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Assignment overview</h2>
        <Link href="/faculty/assignments" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-center text-slate-400 py-8">No assignments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-sm font-semibold text-slate-500">Assignment Name</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Submissions</th>
                <th className="pb-3 text-sm font-semibold text-slate-500 w-48">Progress</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => (
                <tr key={a._id} className="border-b border-slate-100 last:border-0">
                  <td className="py-4 font-medium text-slate-800">{a.title}</td>
                  <td className="py-4 text-slate-600 text-sm">{a.courseTitle}</td>
                  <td className="py-4 text-slate-700 font-medium">{a.submittedCount}/{a.totalStudents}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-700 rounded-full transition-all duration-500" style={{ width: `${a.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 font-medium w-8">{a.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor[a.status] || "bg-slate-100 text-slate-600"}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AIGradingInsights({ assignments, submissions }) {
  const publishedSubs = submissions.filter((s) => s.aiGrade !== null && s.aiGrade !== undefined);

  const classAverage =
    publishedSubs.length > 0
      ? (
          publishedSubs.reduce((sum, s) => sum + (s.aiGrade / (s.assignment?.totalPoints || 100)) * 100, 0) /
          publishedSubs.length
        ).toFixed(1)
      : null;

  const gradedAssignments = assignments.filter((a) => a.publishedCount > 0);
  const lowestScoring = gradedAssignments.length
    ? gradedAssignments.reduce((lowest, a) => {
        const pct = (a.avgPublishedScore / a.totalPoints) * 100;
        const lowestPct = (lowest.avgPublishedScore / lowest.totalPoints) * 100;
        return pct < lowestPct ? a : lowest;
      })
    : null;

  const pendingReviewTotal = assignments.reduce((sum, a) => sum + a.pendingReviewCount, 0);
  const overdueCount = assignments.filter((a) => a.status === "Overdue").length;

  const insights = [];
  if (pendingReviewTotal > 0) {
    insights.push({
      icon: <Info size={16} className="text-amber-500" />,
      text: `${pendingReviewTotal} graded submission${pendingReviewTotal !== 1 ? "s" : ""} awaiting your review before publishing.`,
    });
  }
  if (lowestScoring) {
    insights.push({
      icon: <TrendingDown size={16} className="text-red-500" />,
      text: `"${lowestScoring.title}" has the lowest average score (${((lowestScoring.avgPublishedScore / lowestScoring.totalPoints) * 100).toFixed(1)}%).`,
    });
  }
  if (overdueCount > 0) {
    insights.push({
      icon: <TrendingDown size={16} className="text-red-500" />,
      text: `${overdueCount} assignment${overdueCount !== 1 ? "s are" : " is"} overdue with missing submissions.`,
    });
  }
  if (insights.length === 0) {
    insights.push({
      icon: <TrendingUp size={16} className="text-emerald-500" />,
      text: "No grading activity yet — insights will appear once assignments are graded.",
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <Brain size={22} className="text-slate-700" />
        <h2 className="text-xl font-semibold text-slate-800">AI Grading Insights</h2>
      </div>

      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-1">Class Average (published grades)</p>
        <h3 className="text-5xl font-bold text-slate-800">{classAverage !== null ? `${classAverage}%` : "—"}</h3>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Insights</p>
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700">
            <span className="mt-0.5 shrink-0">{insight.icon}</span>
            <span>{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComingSoonPanel({ title, description, linkHref, linkLabel, large }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className={large ? "text-2xl font-semibold text-slate-800" : "text-xl font-semibold text-slate-800"}>{title}</h2>
        <Link href={linkHref} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          {linkLabel}
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Construction size={28} className="text-slate-400 mb-3" />
        <p className="font-medium text-slate-600">To be implemented</p>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>
      </div>
    </div>
  );
}
