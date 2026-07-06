"use client";

import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  Users,
  FileWarning,
  Loader2,
} from "lucide-react";


/* ──────────────────────────────────────────────
   MOCK DATA — swap these out for fetch() later
   ────────────────────────────────────────────── */

const mockAllSimilarityFlags = [
  { id: 1, studentName: "Ahmed Raza",       enrollmentId: "SP26-BCS-015", assignment: "Database ER Diagram",        course: "CS-301", similarityPercentage: 87, status: "Unreviewed" },
  { id: 2, studentName: "Sara Khan",        enrollmentId: "SP26-BCS-028", assignment: "UML Class Diagram",          course: "CS-304", similarityPercentage: 72, status: "Unreviewed" },
  { id: 3, studentName: "Usman Ali",        enrollmentId: "SP26-BCS-033", assignment: "SQL Query Optimization",     course: "CS-301", similarityPercentage: 65, status: "Reviewed"   },
  { id: 4, studentName: "Fatima Noor",      enrollmentId: "SP26-BSE-012", assignment: "TCP/IP Analysis Report",     course: "CS-307", similarityPercentage: 58, status: "Cleared"    },
  { id: 5, studentName: "Hassan Tariq",     enrollmentId: "SP26-BCS-045", assignment: "Neural Network Lab",         course: "CS-401", similarityPercentage: 91, status: "Unreviewed" },
  { id: 6, studentName: "Ayesha Siddiqui",  enrollmentId: "SP26-BCS-019", assignment: "Agile Methodology Report",   course: "CS-304", similarityPercentage: 78, status: "Reviewed"   },
  { id: 7, studentName: "Imran Sheikh",     enrollmentId: "SP26-BSE-025", assignment: "Network Security Analysis",  course: "CS-307", similarityPercentage: 62, status: "Unreviewed" },
  { id: 8, studentName: "Nadia Qureshi",    enrollmentId: "SP26-BCS-051", assignment: "Decision Tree Implementation", course: "CS-401", similarityPercentage: 55, status: "Cleared"  },
];



export default function Plagiarism() {

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loadingIds, setLoadingIds] = useState({});

  const handleReview = (id) => {
    setLoadingIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      import("react-toastify").then(({ toast }) => {
        toast.info("Detailed plagiarism review is coming soon.");
      });
      setLoadingIds(prev => ({ ...prev, [id]: false }));
    }, 500);
  };

  const filtered = mockAllSimilarityFlags.filter((f) => {
    const matchSearch =
      f.studentName.toLowerCase().includes(search.toLowerCase()) ||
      f.assignment.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalFlags    = mockAllSimilarityFlags.length;
  const unreviewed    = mockAllSimilarityFlags.filter((f) => f.status === "Unreviewed").length;
  const highRisk      = mockAllSimilarityFlags.filter((f) => f.similarityPercentage >= 70).length;
  const avgSimilarity = (mockAllSimilarityFlags.reduce((s, f) => s + f.similarityPercentage, 0) / totalFlags).toFixed(1);

  const statusColor = {
    Unreviewed: "bg-amber-100 text-amber-700",
    Reviewed:   "bg-slate-100 text-slate-700",
    Cleared:    "bg-emerald-100 text-emerald-700",
  };


  return (

    <div className="space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Plagiarism Detection</h1>
        <p className="text-slate-500 mt-2">Review semantic similarity flags across all assignments</p>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<ShieldAlert size={22} />}   title="Total Flags"       value={totalFlags}             accent="bg-slate-100 text-slate-700" />
        <StatCard icon={<AlertTriangle size={22} />} title="Unreviewed"        value={unreviewed}             accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<FileWarning size={22} />}   title="High Risk (≥70%)"  value={highRisk}               accent="bg-red-50 text-red-600" />
        <StatCard icon={<Users size={22} />}         title="Avg Similarity"    value={`${avgSimilarity}%`}    accent="bg-slate-100 text-slate-700" />
      </div>


      {/* Search + Filter + Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

        <div className="flex flex-col sm:flex-row gap-4 mb-6">

          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or assignment…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="All">All Status</option>
              <option value="Unreviewed">Unreviewed</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Cleared">Cleared</option>
            </select>
          </div>

        </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left">

            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-sm font-semibold text-slate-500">Student Name</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Enrollment ID</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Assignment</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Similarity</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Status</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 last:border-0">

                  <td className="py-4 font-medium text-slate-800">{f.studentName}</td>

                  <td className="py-4 text-slate-600 text-sm font-mono">{f.enrollmentId}</td>

                  <td className="py-4 text-slate-600 text-sm">{f.assignment}</td>

                  <td className="py-4 text-slate-600 text-sm">{f.course}</td>

                  <td className="py-4">
                    <span className={`text-lg font-bold ${f.similarityPercentage >= 70 ? "text-red-600" : "text-amber-600"}`}>
                      {f.similarityPercentage}%
                    </span>
                  </td>

                  <td className="py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor[f.status]}`}>
                      {f.status}
                    </span>
                  </td>

                  <td className="py-4">
                    <button
                      onClick={() => handleReview(f.id)}
                      disabled={loadingIds[f.id]}
                      className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {loadingIds[f.id] ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                      {loadingIds[f.id] ? "Loading..." : "Review"}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-8">No flags found.</p>
          )}
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
