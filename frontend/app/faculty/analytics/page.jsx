"use client";

import {
  TrendingUp,
  Users,
  FileCheck,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { useFacultyOverview } from "../../../hooks/useFacultyOverview";

export default function Analytics() {
  const { courses, assignments, submissions, loading, error } = useFacultyOverview();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 size={20} className="animate-spin" />
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-24 text-red-500">Error: {error}</div>;
  }

  const coursePerformance = courses.map((course) => {
    const courseAssignments = assignments.filter((a) => a.courseId === course._id);
    const courseSubs = submissions.filter((s) => courseAssignments.some((a) => a._id === s.assignment?._id));

    const published = courseSubs.filter((s) => s.aiGrade !== null && s.aiGrade !== undefined);
    const avgGrade =
      published.length > 0
        ? published.reduce((sum, s) => sum + (s.aiGrade / (s.assignment?.totalPoints || 100)) * 100, 0) / published.length
        : null;

    const passCount = published.filter((s) => s.aiGrade / (s.assignment?.totalPoints || 100) >= 0.5).length;
    const passRate = published.length > 0 ? (passCount / published.length) * 100 : null;

    const studentCount = course.students?.length || 0;
    const possibleSubmissions = studentCount * courseAssignments.length;
    const submissionRate = possibleSubmissions > 0 ? (courseSubs.length / possibleSubmissions) * 100 : null;

    return {
      id: course._id,
      course: course.title,
      students: studentCount,
      avgGrade,
      submissionRate,
      passRate,
    };
  });

  const withGrades = coursePerformance.filter((c) => c.avgGrade !== null);
  const totalStudents = coursePerformance.reduce((s, c) => s + c.students, 0);
  const overallAvg = withGrades.length ? (withGrades.reduce((s, c) => s + c.avgGrade, 0) / withGrades.length).toFixed(1) : null;
  const withSubmRate = coursePerformance.filter((c) => c.submissionRate !== null);
  const overallSubmRate = withSubmRate.length ? (withSubmRate.reduce((s, c) => s + c.submissionRate, 0) / withSubmRate.length).toFixed(1) : null;
  const withPassRate = coursePerformance.filter((c) => c.passRate !== null);
  const overallPassRate = withPassRate.length ? (withPassRate.reduce((s, c) => s + c.passRate, 0) / withPassRate.length).toFixed(1) : null;

  // Monthly trends, derived from real submission timestamps.
  // (Attendance isn't tracked by this module, so that column is marked
  // as a placeholder rather than showing fabricated numbers.)
  const monthMap = {};
  submissions.forEach((s) => {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthMap[key]) {
      monthMap[key] = {
        label: d.toLocaleString("default", { month: "long", year: "numeric" }),
        sortKey: d.getFullYear() * 12 + d.getMonth(),
        totalGrade: 0,
        gradedCount: 0,
        submissionCount: 0,
      };
    }
    monthMap[key].submissionCount += 1;
    if (s.aiGrade !== null && s.aiGrade !== undefined) {
      monthMap[key].totalGrade += (s.aiGrade / (s.assignment?.totalPoints || 100)) * 100;
      monthMap[key].gradedCount += 1;
    }
  });

  const monthlyTrends = Object.values(monthMap)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((m) => ({
      month: m.label,
      avgGrade: m.gradedCount > 0 ? (m.totalGrade / m.gradedCount).toFixed(1) : null,
      submissions: m.submissionCount,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-500 mt-2">Performance insights across all courses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<Users size={22} />} title="Total Students" value={totalStudents} accent="bg-slate-100 text-slate-700" />
        <StatCard icon={<GraduationCap size={22} />} title="Avg Grade" value={overallAvg !== null ? `${overallAvg}%` : "—"} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<FileCheck size={22} />} title="Submission Rate" value={overallSubmRate !== null ? `${overallSubmRate}%` : "—"} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<TrendingUp size={22} />} title="Pass Rate" value={overallPassRate !== null ? `${overallPassRate}%` : "—"} accent="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Course Performance</h2>

        {coursePerformance.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No courses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Students</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Avg Grade</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Submission Rate</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {coursePerformance.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 font-medium text-slate-800">{c.course}</td>
                    <td className="py-4 text-slate-700 font-medium">{c.students}</td>
                    <td className="py-4">
                      {c.avgGrade !== null ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                            <div className="h-full bg-slate-700 rounded-full" style={{ width: `${c.avgGrade}%` }} />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{c.avgGrade.toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No published grades</span>
                      )}
                    </td>
                    <td className="py-4 text-slate-700 font-medium">
                      {c.submissionRate !== null ? `${c.submissionRate.toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-4">
                      {c.passRate !== null ? (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            c.passRate >= 90
                              ? "bg-emerald-100 text-emerald-700"
                              : c.passRate >= 80
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.passRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Monthly Trends</h2>

        {monthlyTrends.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Not enough graded activity yet to show monthly trends.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-sm font-semibold text-slate-500">Month</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Avg Grade</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Submissions</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((m) => (
                  <tr key={m.month} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 font-medium text-slate-800">{m.month}</td>
                    <td className="py-4 text-slate-700 font-medium">{m.avgGrade !== null ? `${m.avgGrade}%` : "—"}</td>
                    <td className="py-4 text-slate-700 font-medium">{m.submissions}</td>
                    <td className="py-4">
                      <span className="text-xs text-slate-400 italic">Not yet integrated</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, accent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${accent}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h2 className="text-3xl font-bold text-slate-800">{value}</h2>
        </div>
      </div>
    </div>
  );
}
