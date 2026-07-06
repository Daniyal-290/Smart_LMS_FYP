"use client";

import {
  TrendingUp,
  Users,
  FileCheck,
  GraduationCap,
} from "lucide-react";


/* ──────────────────────────────────────────────
   MOCK DATA — swap these out for fetch() later
   ────────────────────────────────────────────── */

const coursePerformance = [
  { id: 1, course: "CS-301 Database Systems",       students: 50, avgGrade: 82, submissionRate: 94, passRate: 92 },
  { id: 2, course: "CS-304 Software Engineering",   students: 48, avgGrade: 76, submissionRate: 88, passRate: 85 },
  { id: 3, course: "CS-307 Computer Networks",      students: 46, avgGrade: 79, submissionRate: 91, passRate: 89 },
  { id: 4, course: "CS-401 Artificial Intelligence", students: 41, avgGrade: 71, submissionRate: 82, passRate: 78 },
];

const monthlyTrends = [
  { month: "January",  avgGrade: 74, submissions: 180, attendance: "88%" },
  { month: "February", avgGrade: 76, submissions: 195, attendance: "85%" },
  { month: "March",    avgGrade: 78, submissions: 203, attendance: "87%" },
  { month: "April",    avgGrade: 79, submissions: 210, attendance: "86%" },
];



export default function Analytics() {

  const totalStudents    = coursePerformance.reduce((s, c) => s + c.students, 0);
  const overallAvg       = (coursePerformance.reduce((s, c) => s + c.avgGrade, 0) / coursePerformance.length).toFixed(1);
  const overallSubmRate  = (coursePerformance.reduce((s, c) => s + c.submissionRate, 0) / coursePerformance.length).toFixed(1);
  const overallPassRate  = (coursePerformance.reduce((s, c) => s + c.passRate, 0) / coursePerformance.length).toFixed(1);


  return (

    <div className="space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-500 mt-2">Performance insights across all courses</p>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<Users size={22} />}         title="Total Students"  value={totalStudents}             accent="bg-slate-100 text-slate-700" />
        <StatCard icon={<GraduationCap size={22} />} title="Avg Grade"       value={`${overallAvg}%`}          accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<FileCheck size={22} />}     title="Submission Rate"  value={`${overallSubmRate}%`}     accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<TrendingUp size={22} />}    title="Pass Rate"       value={`${overallPassRate}%`}     accent="bg-emerald-50 text-emerald-600" />
      </div>


      {/* Course Performance */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Course Performance</h2>

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
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                        <div
                          className="h-full bg-slate-700 rounded-full"
                          style={{ width: `${c.avgGrade}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{c.avgGrade}%</span>
                    </div>
                  </td>

                  <td className="py-4 text-slate-700 font-medium">{c.submissionRate}%</td>

                  <td className="py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        c.passRate >= 90
                          ? "bg-emerald-100 text-emerald-700"
                          : c.passRate >= 80
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.passRate}%
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>


      {/* Monthly Trends */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Monthly Trends</h2>

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
                  <td className="py-4 text-slate-700 font-medium">{m.avgGrade}%</td>
                  <td className="py-4 text-slate-700 font-medium">{m.submissions}</td>
                  <td className="py-4 text-slate-700 font-medium">{m.attendance}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

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
