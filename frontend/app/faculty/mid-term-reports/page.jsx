"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Download,
  Users,
  FileBarChart,
  TrendingDown,
  Loader2,
  Save,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000/api";

export default function MidTermReports() {
  // ── State ──
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});       // { studentId: marks }
  const [midtermTotal, setMidtermTotal] = useState(0);
  const [atRiskStudents, setAtRiskStudents] = useState([]);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [marksSaved, setMarksSaved] = useState(false);

  // ── Step 1 — Fetch teacher's courses ──
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // ── Step 2 — When a course is selected, fetch students, policy, and existing marks ──
  useEffect(() => {
    if (!selectedCourseId) {
      setStudents([]);
      setMarksMap({});
      setAtRiskStudents([]);
      setMarksSaved(false);
      return;
    }

    const fetchCourseData = async () => {
      setLoadingStudents(true);
      setAtRiskStudents([]);
      setMarksSaved(false);

      try {
        const token = localStorage.getItem("token");

        // Fetch course details (to get enrolled students)
        const courseRes = await fetch(`${API_URL}/courses/${selectedCourseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch exam policy
        const policyRes = await fetch(`${API_URL}/exam-policy`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch existing marks
        const marksRes = await fetch(`${API_URL}/reports/midterm-marks/${selectedCourseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setStudents(courseData.students || []);
        }

        if (policyRes.ok) {
          const policyData = await policyRes.json();
          if (policyData && policyData.midtermTotalMarks) {
            setMidtermTotal(policyData.midtermTotalMarks);
          } else {
            setMidtermTotal(0);
            toast.warning("Exam policy has not been set by admin yet.");
          }
        }

        if (marksRes.ok) {
          const existingMarks = await marksRes.json();
          const map = {};
          existingMarks.forEach((m) => {
            if (m.student) {
              map[m.student._id] = m.marks;
            }
          });
          setMarksMap(map);

          // If there are existing marks, show at-risk automatically
          if (existingMarks.length > 0) {
            setMarksSaved(true);
            fetchAtRisk(selectedCourseId, token);
          }
        }
      } catch (err) {
        console.error("Failed to load course data", err);
        toast.error("Failed to load course data");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchCourseData();
  }, [selectedCourseId]);

  // ── Fetch at-risk students ──
  const fetchAtRisk = async (courseId, token) => {
    try {
      const res = await fetch(`${API_URL}/reports/midterm-risk/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAtRiskStudents(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch at-risk students", err);
    }
  };

  // ── Handle marks input change ──
  const handleMarksChange = (studentId, value) => {
    const num = value === "" ? "" : Math.min(Math.max(0, Number(value)), midtermTotal);
    setMarksMap((prev) => ({ ...prev, [studentId]: num }));
  };

  // ── Save marks ──
  const handleSave = async () => {
    if (midtermTotal === 0) {
      toast.error("Exam policy not configured. Ask admin to set it first.");
      return;
    }

    const marksArray = Object.entries(marksMap)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([studentId, marks]) => ({
        studentId,
        marks: Number(marks),
      }));

    if (marksArray.length === 0) {
      toast.warning("Please enter marks for at least one student.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/reports/midterm-marks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          marks: marksArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save marks");

      toast.success("Midterm marks saved successfully!");
      setMarksSaved(true);

      // Fetch at-risk after saving
      await fetchAtRisk(selectedCourseId, token);
    } catch (err) {
      toast.error(err.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  // ── Download CSV ──
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/reports/midterm-risk/${selectedCourseId}?format=csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If JSON response (no at-risk students)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        toast.info(data.message || "No at-risk students to download.");
        return;
      }

      // Download CSV
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "midterm-risk-report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch (err) {
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  // ── Computed stats ──
  const totalEnrolled = students.length;
  const totalEntered = Object.values(marksMap).filter((v) => v !== "" && v !== undefined).length;
  const atRiskCount = atRiskStudents.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mid-Term Reports</h1>
          <p className="text-slate-500 mt-2">
            Enter midterm marks and identify at-risk students
          </p>
        </div>

        {marksSaved && atRiskStudents.length > 0 && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {downloading ? "Downloading..." : "Download Risk Report"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={22} />}
          title="Enrolled Students"
          value={totalEnrolled}
          accent="bg-slate-100 text-slate-700"
        />
        <StatCard
          icon={<FileBarChart size={22} />}
          title="Marks Entered"
          value={totalEntered}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<AlertTriangle size={22} />}
          title="At-Risk Students"
          value={atRiskCount}
          accent="bg-red-50 text-red-600"
        />
        <StatCard
          icon={<TrendingDown size={22} />}
          title="Midterm Total"
          value={midtermTotal || "—"}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Course Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Course</h2>

        {loadingCourses ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <p className="text-slate-500">No courses assigned to you.</p>
        ) : (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full max-w-md bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition"
          >
            <option value="">— Select a course —</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} {c.courseCode ? `(${c.courseCode})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Marks Entry Table */}
      {selectedCourseId && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Enter Midterm Marks
              {midtermTotal > 0 && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  (out of {midtermTotal})
                </span>
              )}
            </h2>

            <button
              onClick={handleSave}
              disabled={saving || midtermTotal === 0}
              className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving..." : "Save Marks"}
            </button>
          </div>

          {midtermTotal === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> Exam policy has not been configured yet.
                Please ask the administrator to set midterm total marks in Exam Settings.
              </p>
            </div>
          )}

          {loadingStudents ? (
            <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
              <Loader2 size={18} className="animate-spin" /> Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No students enrolled in this course.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-sm font-semibold text-slate-500">#</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Student Name</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Enrollment ID</th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">
                      Marks (/{midtermTotal})
                    </th>
                    <th className="pb-3 text-sm font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => {
                    const studentId = s._id;
                    const currentMarks = marksMap[studentId];
                    const hasMarks = currentMarks !== undefined && currentMarks !== "";
                    const isAtRisk = hasMarks && midtermTotal > 0 && Number(currentMarks) < midtermTotal * 0.5;

                    return (
                      <tr
                        key={studentId}
                        className={`border-b border-slate-100 last:border-0 ${
                          isAtRisk ? "bg-red-50/50" : ""
                        }`}
                      >
                        <td className="py-4 text-slate-500 text-sm">{idx + 1}</td>
                        <td className="py-4 font-medium text-slate-800">{s.name}</td>
                        <td className="py-4 text-slate-600 text-sm font-mono">
                          {s.enrollmentId || "—"}
                        </td>
                        <td className="py-4">
                          <input
                            type="number"
                            min="0"
                            max={midtermTotal}
                            disabled={midtermTotal === 0}
                            value={currentMarks ?? ""}
                            onChange={(e) => handleMarksChange(studentId, e.target.value)}
                            placeholder="—"
                            className="w-24 bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition disabled:opacity-50"
                          />
                        </td>
                        <td className="py-4">
                          {hasMarks ? (
                            isAtRisk ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                <AlertTriangle size={12} /> At Risk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <CheckCircle size={12} /> Passing
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* At-Risk Report Table */}
      {marksSaved && atRiskStudents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-50 p-3 rounded-xl text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">At-Risk Students</h2>
              <p className="text-slate-500 text-sm">
                Students scoring below 50% of midterm total ({midtermTotal} marks)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-sm font-semibold text-slate-500">Student Name</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Enrollment ID</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Marks</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Total</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.map((m) => (
                  <tr
                    key={m._id}
                    className="border-b border-slate-100 last:border-0 bg-red-50/30"
                  >
                    <td className="py-4 font-medium text-slate-800">
                      {m.student?.name || "Unknown"}
                    </td>
                    <td className="py-4 text-slate-600 text-sm font-mono">
                      {m.student?.enrollmentId || "—"}
                    </td>
                    <td className="py-4 font-bold text-red-600">{m.marks}</td>
                    <td className="py-4 text-slate-700">{m.totalMarks}</td>
                    <td className="py-4">
                      <span className="font-bold text-red-600">
                        {((m.marks / m.totalMarks) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No at-risk message */}
      {marksSaved && atRiskStudents.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <CheckCircle size={32} className="text-emerald-600 mx-auto mb-3" />
          <p className="text-emerald-800 font-semibold">All students are passing!</p>
          <p className="text-emerald-600 text-sm mt-1">
            No students scored below 50% of the midterm total.
          </p>
        </div>
      )}
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
