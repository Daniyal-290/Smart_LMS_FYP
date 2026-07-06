import { Link } from "react-router-dom";
import {
  Users,
  FileCheck,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Info,
  Brain,
} from "lucide-react";



/* ──────────────────────────────────────────────
   MOCK DATA — swap these out for fetch() later
   ────────────────────────────────────────────── */

const mockAssignments = [
  { id: 1, title: "Database ER Diagram",     course: "CS-301 Database Systems",       submitted: 45, total: 50, status: "Graded",  progress: 90 },
  { id: 2, title: "UML Class Diagram",       course: "CS-304 Software Engineering",   submitted: 38, total: 48, status: "Pending", progress: 79 },
  { id: 3, title: "TCP/IP Analysis Report",  course: "CS-307 Computer Networks",      submitted: 42, total: 46, status: "Graded",  progress: 91 },
  { id: 4, title: "Neural Network Lab",      course: "CS-401 Artificial Intelligence", submitted: 30, total: 41, status: "Overdue", progress: 73 },
  { id: 5, title: "SQL Query Optimization",  course: "CS-301 Database Systems",       submitted: 48, total: 50, status: "Pending", progress: 96 },
];

const mockSimilarityFlags = [
  { id: 1, studentName: "Ahmed Raza",  assignment: "Database ER Diagram",    similarityPercentage: 87 },
  { id: 2, studentName: "Sara Khan",   assignment: "UML Class Diagram",      similarityPercentage: 72 },
  { id: 3, studentName: "Usman Ali",   assignment: "SQL Query Optimization", similarityPercentage: 65 },
  { id: 4, studentName: "Fatima Noor", assignment: "TCP/IP Analysis Report", similarityPercentage: 58 },
];

const mockMidTermRisks = [
  { id: 1, studentName: "Ali Hassan",   enrollmentId: "SP26-BCS-041", class: "6th Semester", course: "CS-301 Database Systems",       program: "BSCS" },
  { id: 2, studentName: "Zainab Malik", enrollmentId: "SP26-BCS-023", class: "6th Semester", course: "CS-304 Software Engineering",   program: "BSCS" },
  { id: 3, studentName: "Bilal Ahmed",  enrollmentId: "SP26-BCS-057", class: "8th Semester", course: "CS-401 Artificial Intelligence", program: "BSCS" },
  { id: 4, studentName: "Hira Farooq",  enrollmentId: "SP26-BSE-018", class: "6th Semester", course: "CS-307 Computer Networks",      program: "BSE"  },
  { id: 5, studentName: "Kamran Shah",  enrollmentId: "SP26-BCS-032", class: "8th Semester", course: "CS-401 Artificial Intelligence", program: "BSCS" },
];



/* ──────────────────────────────────────────────
   AI Insights (inline — not required as mock)
   ────────────────────────────────────────────── */

const aiInsights = [
  { id: 1, text: "Assignment 3 scored 15% below the class average",       icon: <TrendingDown size={16} className="text-red-500" /> },
  { id: 2, text: "CS-301 class average improved by 8% this week",         icon: <TrendingUp  size={16} className="text-emerald-500" /> },
  { id: 3, text: "3 students show a consistent improvement trend",        icon: <TrendingUp  size={16} className="text-emerald-500" /> },
  { id: 4, text: "Neural Network Lab needs manual review (5 submissions)", icon: <Info        size={16} className="text-amber-500" /> },
];



/* ══════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════ */

export default function FacultyDashboard() {

  return (

    <div className="space-y-8">

      {/* ── Stat Grid ── */}
      <StatGrid />

      {/* ── Assignment Table ── */}
      <AssignmentTable />

      {/* ── Two-column: AI Insights + Similarity Flags ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIGradingInsights />
        <SimilarityFlags />
      </div>

      {/* ── Mid-Term Risk Roster ── */}
      <MidTermRiskRoster />

    </div>

  );

}



/* ══════════════════════════════════════════════
   1 · StatGrid  (4 cards)
   ══════════════════════════════════════════════ */

function StatGrid() {

  const stats = [
    { title: "Total Students",        value: "187", icon: <Users         size={22} />, accent: "bg-slate-100   text-slate-700" },
    { title: "Submitted Assignments", value: "203", icon: <FileCheck     size={22} />, accent: "bg-emerald-50  text-emerald-600" },
    { title: "Pending Review",        value: "14",  icon: <Clock         size={22} />, accent: "bg-amber-50    text-amber-600" },
    { title: "Mid-Term At-Risk",      value: "5",   icon: <AlertTriangle size={22} />, accent: "bg-red-50      text-red-600" },
  ];


  return (

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

      {stats.map((s) => (

        <div
          key={s.title}
          className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            shadow-sm
            p-6
            hover:shadow-md
            hover:-translate-y-0.5
            transition-all
            duration-300
          "
        >

          <div className="flex items-center gap-4">

            <div className={`p-3 rounded-xl ${s.accent}`}>
              {s.icon}
            </div>

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



/* ══════════════════════════════════════════════
   2 · AssignmentTable
   ══════════════════════════════════════════════ */

function AssignmentTable() {

  const statusColor = {
    Graded:  "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100   text-amber-700",
    Overdue: "bg-red-100     text-red-700",
  };


  return (

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          Assignment overview
        </h2>
        <Link to="/faculty/assignments" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          View all
        </Link>
      </div>

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

            {mockAssignments.map((a) => (

              <tr
                key={a.id}
                className="border-b border-slate-100 last:border-0"
              >

                <td className="py-4 font-medium text-slate-800">
                  {a.title}
                </td>

                <td className="py-4 text-slate-600 text-sm">
                  {a.course}
                </td>

                <td className="py-4 text-slate-700 font-medium">
                  {a.submitted}/{a.total}
                </td>

                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 rounded-full transition-all duration-500"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium w-8">
                      {a.progress}%
                    </span>
                  </div>
                </td>

                <td className="py-4">
                  <span
                    className={`
                      inline-block
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      font-semibold
                      ${statusColor[a.status] || "bg-slate-100 text-slate-600"}
                    `}
                  >
                    {a.status}
                  </span>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════════
   3 · AIGradingInsights
   ══════════════════════════════════════════════ */

function AIGradingInsights() {

  return (

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

      <div className="flex items-center gap-3 mb-6">
        <Brain size={22} className="text-slate-700" />
        <h2 className="text-xl font-semibold text-slate-800">
          AI Grading Insights
        </h2>
      </div>


      {/* Class Average — large typography */}

      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-1">Class Average</p>
        <h3 className="text-5xl font-bold text-slate-800">78.4%</h3>
      </div>


      {/* Recent Insights */}

      <div className="space-y-3">

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recent Insights
        </p>

        {aiInsights.map((insight) => (

          <div
            key={insight.id}
            className="
              flex
              items-start
              gap-3
              p-3
              bg-slate-50
              rounded-xl
              text-sm
              text-slate-700
            "
          >
            <span className="mt-0.5 shrink-0">{insight.icon}</span>
            <span>{insight.text}</span>
          </div>

        ))}

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════════
   4 · SimilarityFlags
   ══════════════════════════════════════════════ */

function SimilarityFlags() {

  return (

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">
          Similarity Flags
        </h2>
        <Link to="/faculty/plagiarism" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          All detections
        </Link>
      </div>

      <div className="space-y-4">

        {mockSimilarityFlags.map((flag) => (

          <div
            key={flag.id}
            className="
              flex
              items-center
              justify-between
              p-4
              border
              border-slate-100
              rounded-xl
              hover:bg-slate-50
              transition
            "
          >

            <div>
              <p className="font-medium text-slate-800">{flag.studentName}</p>
              <p className="text-sm text-slate-500">{flag.assignment}</p>
            </div>

            <div className="flex items-center gap-4">

              <span className="text-lg font-bold text-red-600">
                {flag.similarityPercentage}%
              </span>

              <button
                onClick={() => {
                  import("react-toastify").then(({ toast }) => {
                    toast.info("Detailed plagiarism review is coming soon.");
                  });
                }}
                className="
                  flex
                  items-center
                  gap-1.5
                  bg-slate-800
                  text-white
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  font-medium
                  hover:bg-slate-700
                  transition
                  cursor-pointer
                "
              >
                <Eye size={15} />
                Review
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════════
   5 · MidTermRiskRoster
   ══════════════════════════════════════════════ */

function MidTermRiskRoster() {

  return (

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-semibold text-slate-800">
          Mid-Term Risk Roster
        </h2>

        <div className="flex items-center gap-4">
          <Link to="/faculty/mid-term-reports" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition">
            View all
          </Link>
          <button
            onClick={() => {
              import("react-toastify").then(({ toast }) => {
                toast.info("Report generation is not yet integrated.");
              });
            }}
            className="
              flex
              items-center
              gap-2
              bg-slate-800
              text-white
              px-5
              py-2.5
              rounded-xl
              font-medium
              hover:bg-slate-700
              transition
              cursor-pointer
            "
          >
            <Download size={18} />
            Download Risk Report
          </button>
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
            </tr>
          </thead>

          <tbody>

            {mockMidTermRisks.map((s) => (

              <tr
                key={s.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="py-4 font-medium text-slate-800">{s.studentName}</td>
                <td className="py-4 text-slate-600 text-sm font-mono">{s.enrollmentId}</td>
                <td className="py-4 text-slate-600 text-sm">{s.class}</td>
                <td className="py-4 text-slate-600 text-sm">{s.course}</td>
                <td className="py-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {s.program}
                  </span>
                </td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}