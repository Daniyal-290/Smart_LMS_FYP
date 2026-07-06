import { useState } from "react";
import {
  AlertTriangle,
  Download,
  Search,
  Filter,
  Users,
  FileBarChart,
  TrendingDown,
} from "lucide-react";


/* ──────────────────────────────────────────────
   MOCK DATA — swap these out for fetch() later
   ────────────────────────────────────────────── */

const mockAllMidTermRisks = [
  { id: 1, studentName: "Ali Hassan",   enrollmentId: "SP26-BCS-041", class: "6th Semester", course: "CS-301 Database Systems",       program: "BSCS", gpa: 1.8, attendance: "62%" },
  { id: 2, studentName: "Zainab Malik", enrollmentId: "SP26-BCS-023", class: "6th Semester", course: "CS-304 Software Engineering",   program: "BSCS", gpa: 1.5, attendance: "58%" },
  { id: 3, studentName: "Bilal Ahmed",  enrollmentId: "SP26-BCS-057", class: "8th Semester", course: "CS-401 Artificial Intelligence", program: "BSCS", gpa: 1.9, attendance: "71%" },
  { id: 4, studentName: "Hira Farooq",  enrollmentId: "SP26-BSE-018", class: "6th Semester", course: "CS-307 Computer Networks",      program: "BSE",  gpa: 1.6, attendance: "55%" },
  { id: 5, studentName: "Kamran Shah",  enrollmentId: "SP26-BCS-032", class: "8th Semester", course: "CS-401 Artificial Intelligence", program: "BSCS", gpa: 1.7, attendance: "64%" },
  { id: 6, studentName: "Sana Rehman",  enrollmentId: "SP26-BCS-048", class: "6th Semester", course: "CS-301 Database Systems",       program: "BSCS", gpa: 1.4, attendance: "52%" },
  { id: 7, studentName: "Owais Raza",   enrollmentId: "SP26-BSE-031", class: "6th Semester", course: "CS-307 Computer Networks",      program: "BSE",  gpa: 1.8, attendance: "67%" },
  { id: 8, studentName: "Maham Tariq",  enrollmentId: "SP26-BCS-039", class: "8th Semester", course: "CS-401 Artificial Intelligence", program: "BSCS", gpa: 1.3, attendance: "49%" },
];



export default function MidTermReports() {

  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState("All");

  const filtered = mockAllMidTermRisks.filter((s) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollmentId.toLowerCase().includes(search.toLowerCase());
    const matchProgram = filterProgram === "All" || s.program === filterProgram;
    return matchSearch && matchProgram;
  });

  const totalAtRisk   = mockAllMidTermRisks.length;
  const critical      = mockAllMidTermRisks.filter((s) => s.gpa < 1.5).length;
  const lowAttendance = mockAllMidTermRisks.filter((s) => parseInt(s.attendance) < 60).length;


  return (

    <div className="space-y-8">

      {/* Page Header */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mid-Term Risk Reports</h1>
          <p className="text-slate-500 mt-2">Students below the passing threshold</p>
        </div>

        <button
          className="
            flex items-center gap-2
            bg-slate-800 text-white
            px-5 py-2.5
            rounded-xl font-medium
            hover:bg-slate-700 transition cursor-pointer
          "
        >
          <Download size={18} />
          Download Risk Report
        </button>

      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<Users size={22} />}         title="Total At-Risk"        value={totalAtRisk}   accent="bg-red-50 text-red-600" />
        <StatCard icon={<AlertTriangle size={22} />} title="Critical (GPA < 1.5)" value={critical}      accent="bg-red-50 text-red-600" />
        <StatCard icon={<TrendingDown size={22} />}  title="Low Attendance"       value={lowAttendance} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<FileBarChart size={22} />}  title="Courses Affected"     value="4"             accent="bg-slate-100 text-slate-700" />
      </div>


      {/* Search + Filter + Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

        <div className="flex flex-col sm:flex-row gap-4 mb-6">

          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or enrollment ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="All">All Programs</option>
              <option value="BSCS">BSCS</option>
              <option value="BSE">BSE</option>
            </select>
          </div>

        </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left">

            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-sm font-semibold text-slate-500">Student Name</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Enrollment ID</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Class</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Program</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">GPA</th>
                <th className="pb-3 text-sm font-semibold text-slate-500">Attendance</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">

                  <td className="py-4 font-medium text-slate-800">{s.studentName}</td>

                  <td className="py-4 text-slate-600 text-sm font-mono">{s.enrollmentId}</td>

                  <td className="py-4 text-slate-600 text-sm">{s.class}</td>

                  <td className="py-4 text-slate-600 text-sm">{s.course}</td>

                  <td className="py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {s.program}
                    </span>
                  </td>

                  <td className="py-4">
                    <span className={`font-bold ${s.gpa < 1.5 ? "text-red-600" : "text-amber-600"}`}>
                      {s.gpa}
                    </span>
                  </td>

                  <td className="py-4">
                    <span className={`font-medium ${parseInt(s.attendance) < 60 ? "text-red-600" : "text-slate-700"}`}>
                      {s.attendance}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-8">No students found.</p>
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
