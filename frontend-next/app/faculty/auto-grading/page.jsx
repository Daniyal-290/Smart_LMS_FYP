"use client";

import {
  Brain,
  FileCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle,
  Clock,
} from "lucide-react";


/* ──────────────────────────────────────────────
   MOCK DATA — swap these out for fetch() later
   ────────────────────────────────────────────── */

const mockGradingResults = [
  { id: 1, title: "Database ER Diagram",        course: "CS-301", totalSubmissions: 50, aiGraded: 45, manualReview: 5, avgScore: 82, accuracy: 94 },
  { id: 2, title: "UML Class Diagram",          course: "CS-304", totalSubmissions: 48, aiGraded: 42, manualReview: 6, avgScore: 76, accuracy: 91 },
  { id: 3, title: "TCP/IP Analysis Report",     course: "CS-307", totalSubmissions: 46, aiGraded: 44, manualReview: 2, avgScore: 79, accuracy: 96 },
  { id: 4, title: "Neural Network Lab",         course: "CS-401", totalSubmissions: 41, aiGraded: 36, manualReview: 5, avgScore: 71, accuracy: 88 },
  { id: 5, title: "SQL Query Optimization",     course: "CS-301", totalSubmissions: 50, aiGraded: 48, manualReview: 2, avgScore: 85, accuracy: 97 },
  { id: 6, title: "Agile Methodology Report",   course: "CS-304", totalSubmissions: 48, aiGraded: 46, manualReview: 2, avgScore: 81, accuracy: 95 },
];

const aiInsights = [
  { id: 1, text: "Assignment 3 scored 15% below the class average",        icon: <TrendingDown size={16} className="text-red-500" /> },
  { id: 2, text: "CS-301 class average improved by 8% this week",          icon: <TrendingUp  size={16} className="text-emerald-500" /> },
  { id: 3, text: "3 students show a consistent improvement trend",         icon: <TrendingUp  size={16} className="text-emerald-500" /> },
  { id: 4, text: "Neural Network Lab needs manual review (5 submissions)", icon: <Info        size={16} className="text-amber-500" /> },
  { id: 5, text: "Overall AI grading accuracy at 93.5%",                   icon: <CheckCircle size={16} className="text-emerald-500" /> },
  { id: 6, text: "2 assignments pending initial grading setup",            icon: <Clock       size={16} className="text-amber-500" /> },
];



export default function AutoGrading() {

  const totalGraded       = mockGradingResults.reduce((s, r) => s + r.aiGraded, 0);
  const totalSubmissions  = mockGradingResults.reduce((s, r) => s + r.totalSubmissions, 0);
  const totalManualReview = mockGradingResults.reduce((s, r) => s + r.manualReview, 0);
  const avgAccuracy       = (mockGradingResults.reduce((s, r) => s + r.accuracy, 0) / mockGradingResults.length).toFixed(1);


  return (

    <div className="space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">AI Auto Grading</h1>
        <p className="text-slate-500 mt-2">AI-powered grading results and insights</p>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<FileCheck size={22} />}     title="AI Graded"      value={totalGraded}        sub={`of ${totalSubmissions} total`} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<Brain size={22} />}         title="Accuracy Rate"  value={`${avgAccuracy}%`}  sub="Avg across all"                 accent="bg-slate-100 text-slate-700" />
        <StatCard icon={<AlertCircle size={22} />}   title="Manual Review"  value={totalManualReview}  sub="Flagged for review"             accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<TrendingUp size={22} />}    title="Class Average"  value="78.4%"              sub="All courses"                    accent="bg-slate-100 text-slate-700" />
      </div>


      {/* Two-column: Table + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* Grading Results Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Grading Results</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-sm font-semibold text-slate-500">Assignment</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">AI Graded</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Manual Review</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Avg Score</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Accuracy</th>
                </tr>
              </thead>

              <tbody>
                {mockGradingResults.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">

                    <td className="py-4 font-medium text-slate-800">{r.title}</td>

                    <td className="py-4 text-slate-600 text-sm">{r.course}</td>

                    <td className="py-4 text-slate-700 font-medium">
                      {r.aiGraded}/{r.totalSubmissions}
                    </td>

                    <td className="py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          r.manualReview > 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {r.manualReview}
                      </span>
                    </td>

                    <td className="py-4 text-slate-700 font-medium">{r.avgScore}%</td>

                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-20">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${r.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{r.accuracy}%</span>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>



        {/* Insights Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

          <h2 className="text-xl font-semibold text-slate-800 mb-6">Recent Insights</h2>

          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700"
              >
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
