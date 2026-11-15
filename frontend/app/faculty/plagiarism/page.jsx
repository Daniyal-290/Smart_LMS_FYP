"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  Users,
  FileWarning,
  Loader2,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { toast } from "react-toastify";
import PlagiarismModal from "@/components/PlagiarismModal";

const API_URL = "http://localhost:5000/api";

export default function Plagiarism() {
  const [flags, setFlags] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalChecked: 0,
    totalFlags: 0,
    unreviewed: 0,
    highRisk: 0,
    avgSimilarity: "0.0",
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedSub, setSelectedSub] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchPlagiarismData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/submissions/instructor/plagiarism-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags || []);
        setStats(
          data.stats || {
            totalChecked: 0,
            totalFlags: 0,
            unreviewed: 0,
            highRisk: 0,
            avgSimilarity: "0.0",
          }
        );
        setCourses(data.courses || []);
      } else {
        toast.error("Failed to load plagiarism records.");
      }
    } catch (err) {
      console.error("Plagiarism load error:", err);
      toast.error("Network error loading plagiarism records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlagiarismData();
  }, [fetchPlagiarismData]);

  const handleUpdateStatus = async (subId, newStatus) => {
    setUpdatingStatusId(subId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/submissions/${subId}/plagiarism-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Marked as ${newStatus}`);
        setFlags((prev) =>
          prev.map((f) => (f._id === subId ? { ...f, status: newStatus } : f))
        );
        setStats((prev) => {
          const currentFlag = flags.find((f) => f._id === subId);
          const wasUnreviewed =
            (currentFlag?.status === "Unreviewed" || !currentFlag?.status) &&
            (currentFlag?.similarityScore || 0) >= 50;
          const isNowUnreviewed =
            newStatus === "Unreviewed" && (currentFlag?.similarityScore || 0) >= 50;
          const diff = (isNowUnreviewed ? 1 : 0) - (wasUnreviewed ? 1 : 0);
          return {
            ...prev,
            unreviewed: Math.max(0, (prev.unreviewed || 0) + diff),
          };
        });
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Error updating status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleReview = (flag) => {
    setSelectedSub(flag);
    if (flag.status === "Unreviewed" && flag.similarityScore >= 50) {
      handleUpdateStatus(flag._id, "Reviewed");
    }
  };

  const filtered = flags.filter((f) => {
    const sName = f.student?.name || "Unknown Student";
    const sId = f.student?.enrollmentId || "";
    const aTitle = f.assignment?.title || "Assignment";
    const cTitle = f.courseTitle || "";
    const cCode = f.courseCode || "";

    const matchesSearch =
      sName.toLowerCase().includes(search.toLowerCase()) ||
      sId.toLowerCase().includes(search.toLowerCase()) ||
      aTitle.toLowerCase().includes(search.toLowerCase()) ||
      cTitle.toLowerCase().includes(search.toLowerCase()) ||
      cCode.toLowerCase().includes(search.toLowerCase());

    const matchesCourse =
      selectedCourse === "All" ||
      f.assignment?.course?._id === selectedCourse ||
      f.assignment?.course === selectedCourse;

    let matchesFilter = true;
    if (filterStatus === "Unreviewed") matchesFilter = f.status === "Unreviewed";
    else if (filterStatus === "Reviewed") matchesFilter = f.status === "Reviewed";
    else if (filterStatus === "Cleared") matchesFilter = f.status === "Cleared";
    else if (filterStatus === "High Risk") matchesFilter = f.similarityScore >= 75;
    else if (filterStatus === "Moderate")
      matchesFilter = f.similarityScore >= 50 && f.similarityScore < 75;
    else if (filterStatus === "Original") matchesFilter = f.similarityScore < 50;

    return matchesSearch && matchesCourse && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Plagiarism Detection</h1>
          <p className="text-slate-500 mt-2">
            Review semantic similarity flags across all assignments
          </p>
        </div>
        <button
          onClick={fetchPlagiarismData}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-slate-400" : "text-slate-600"} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={<ShieldAlert size={22} />}
          title="Total Flags"
          value={stats.totalFlags}
          accent="bg-slate-100 text-slate-700"
        />
        <StatCard
          icon={<AlertTriangle size={22} />}
          title="Unreviewed"
          value={stats.unreviewed}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={<FileWarning size={22} />}
          title="High Risk (≥75%)"
          value={stats.highRisk}
          accent="bg-red-50 text-red-600"
        />
        <StatCard
          icon={<Users size={22} />}
          title="Avg Similarity"
          value={`${stats.avgSimilarity}%`}
          accent="bg-slate-100 text-slate-700"
        />
      </div>

      {/* Search + Filter + Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by student, enrollment ID, assignment or course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* Course filter */}
          {courses.length > 0 && (
            <div className="relative">
              <BookOpen
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="All">All Courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.courseCode ? `${c.courseCode} · ` : ""}
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter */}
          <div className="relative">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="All">All Status & Tiers</option>
              <option value="Unreviewed">Unreviewed</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Cleared">Cleared</option>
              <option value="High Risk">🔴 High Risk (≥ 75%)</option>
              <option value="Moderate">🟡 Moderate (50% - 74%)</option>
              <option value="Original">🟢 Original (&lt; 50%)</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
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
              {filtered.map((f) => {
                const sName = f.student?.name || "Unknown Student";
                const sId = f.student?.enrollmentId || "N/A";
                const aTitle = f.assignment?.title || "Assignment";
                const score = f.similarityScore || 0;
                const isChecked = Boolean(f.checkedAt);

                return (
                  <tr key={f._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition">
                    <td className="py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {sName.charAt(0).toUpperCase()}
                        </div>
                        <span>{sName}</span>
                      </div>
                    </td>

                    <td className="py-4 text-slate-600 text-sm font-mono">{sId}</td>

                    <td className="py-4 text-slate-700 text-sm font-medium">{aTitle}</td>

                    <td className="py-4 text-slate-600 text-sm">
                      {f.courseCode !== "N/A" ? `${f.courseCode} · ` : ""}
                      {f.courseTitle}
                    </td>

                    <td className="py-4">
                      {isChecked ? (
                        <span
                          className={`text-lg font-bold ${
                            score >= 75
                              ? "text-red-600"
                              : score >= 50
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {score}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm font-medium">Pending Check</span>
                      )}
                    </td>

                    <td className="py-4">
                      <select
                        value={f.status}
                        onChange={(e) => handleUpdateStatus(f._id, e.target.value)}
                        disabled={updatingStatusId === f._id}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer outline-none transition ${
                          f.status === "Unreviewed"
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : f.status === "Cleared"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <option value="Unreviewed">Unreviewed</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Cleared">Cleared</option>
                      </select>
                    </td>

                    <td className="py-4">
                      <button
                        onClick={() => handleReview(f)}
                        className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition cursor-pointer shadow-sm"
                        title="Open detailed plagiarism report"
                      >
                        <Eye size={15} />
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 size={20} className="animate-spin text-slate-400" />
              <span>Loading real-time plagiarism records…</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <ShieldAlert size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No submissions found matching filters.</p>
              <p className="text-xs text-slate-400 mt-1">
                Submissions will appear here dynamically as students submit assignments and plagiarism checks are performed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Plagiarism Review Modal */}
      {selectedSub && (
        <PlagiarismModal
          submission={selectedSub}
          onClose={() => setSelectedSub(null)}
        />
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
