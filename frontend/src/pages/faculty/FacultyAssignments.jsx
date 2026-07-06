import { useState } from "react";
import {
  ClipboardList,
  FileCheck,
  Clock,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";


/* ──────────────────────────────────────────────
   MOCK DATA — swap these out for fetch() later
   ────────────────────────────────────────────── */

const mockAllAssignments = [
  { id: 1, title: "Database ER Diagram",        course: "CS-301 Database Systems",        submitted: 45, total: 50, status: "Graded",  progress: 90, dueDate: "2026-02-15" },
  { id: 2, title: "UML Class Diagram",          course: "CS-304 Software Engineering",    submitted: 38, total: 48, status: "Pending", progress: 79, dueDate: "2026-02-20" },
  { id: 3, title: "TCP/IP Analysis Report",     course: "CS-307 Computer Networks",       submitted: 42, total: 46, status: "Graded",  progress: 91, dueDate: "2026-02-18" },
  { id: 4, title: "Neural Network Lab",         course: "CS-401 Artificial Intelligence", submitted: 30, total: 41, status: "Overdue", progress: 73, dueDate: "2026-02-10" },
  { id: 5, title: "SQL Query Optimization",     course: "CS-301 Database Systems",        submitted: 48, total: 50, status: "Pending", progress: 96, dueDate: "2026-02-25" },
  { id: 6, title: "Agile Methodology Report",   course: "CS-304 Software Engineering",    submitted: 44, total: 48, status: "Graded",  progress: 92, dueDate: "2026-01-30" },
  { id: 7, title: "Network Security Analysis",  course: "CS-307 Computer Networks",       submitted: 40, total: 46, status: "Pending", progress: 87, dueDate: "2026-03-01" },
  { id: 8, title: "Decision Tree Implementation", course: "CS-401 Artificial Intelligence", submitted: 35, total: 41, status: "Pending", progress: 85, dueDate: "2026-03-05" },
];



export default function FacultyAssignments() {

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = mockAllAssignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor = {
    Graded:  "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100   text-amber-700",
    Overdue: "bg-red-100     text-red-700",
  };

  const totalGraded  = mockAllAssignments.filter((a) => a.status === "Graded").length;
  const totalPending = mockAllAssignments.filter((a) => a.status === "Pending").length;
  const totalOverdue = mockAllAssignments.filter((a) => a.status === "Overdue").length;


  return (

    <div className="space-y-8">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">All Assignments</h1>
        <p className="text-slate-500 mt-2">Manage and track all course assignments</p>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<ClipboardList size={22} />} title="Total Assignments" value={mockAllAssignments.length} accent="bg-slate-100 text-slate-700" />
        <StatCard icon={<FileCheck size={22} />}     title="Graded"            value={totalGraded}                accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<Clock size={22} />}         title="Pending"           value={totalPending}               accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<AlertCircle size={22} />}   title="Overdue"           value={totalOverdue}               accent="bg-red-50 text-red-600" />
      </div>


      {/* Search + Filter + Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

        <div className="flex flex-col sm:flex-row gap-4 mb-6">

          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments…"
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
              <option value="Graded">Graded</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

        </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left">

            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-sm font-semibold text-slate-500">Assignment Name</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Due Date</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Submissions</th>
                <th className="pb-3 text-sm font-semibold text-slate-500 w-48">Progress</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">

                  <td className="py-4 font-medium text-slate-800">{a.title}</td>

                  <td className="py-4 text-slate-600 text-sm">{a.course}</td>

                  <td className="py-4 text-slate-600 text-sm">{a.dueDate}</td>

                  <td className="py-4 text-slate-700 font-medium">{a.submitted}/{a.total}</td>

                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-700 rounded-full"
                          style={{ width: `${a.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-medium w-8">{a.progress}%</span>
                    </div>
                  </td>

                  <td className="py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor[a.status]}`}>
                      {a.status}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-8">No assignments found.</p>
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
