"use client";

import { useState } from "react";
import {
  ClipboardList,
  FileCheck,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  Paperclip,
} from "lucide-react";
import { toast } from "react-toastify";
import { useFacultyOverview } from "../../../hooks/useFacultyOverview";

const API_URL = "http://localhost:5000/api";

export default function FacultyAssignments() {
  const { assignments, loading, error, refetch } = useFacultyOverview();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Edit modal state
  const [editing, setEditing] = useState(null); // assignment object or null
  const [editForm, setEditForm] = useState({ title: "", dueDate: "", totalPoints: 100 });
  const [editFile, setEditFile] = useState(null); // new File to replace the current attachment, if chosen
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // assignment object or null

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.courseTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor = {
    Graded: "bg-emerald-100 text-emerald-700",
    "Pending Review": "bg-amber-100 text-amber-700",
    Pending: "bg-amber-100 text-amber-700",
    Overdue: "bg-red-100 text-red-700",
    "No Submissions": "bg-slate-100 text-slate-500",
  };

  const totalGraded = assignments.filter((a) => a.status === "Graded").length;
  const totalPendingReview = assignments.filter((a) => a.status === "Pending Review" || a.status === "Pending").length;
  const totalOverdue = assignments.filter((a) => a.status === "Overdue").length;

  const openEdit = (a) => {
    setEditForm({
      title: a.title,
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : "",
      totalPoints: a.totalPoints,
    });
    setEditFile(null);
    setEditing(a);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditFile(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      // Always send as multipart form data — the backend route accepts
      // an optional file alongside the text fields, and multer parses
      // both from the same multipart body whether or not a file is present.
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("dueDate", editForm.dueDate);
      formData.append("totalPoints", editForm.totalPoints);
      if (editFile) {
        formData.append("file", editFile);
      }

      const res = await fetch(`${API_URL}/assignments/${editing._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type — browser sets multipart boundary
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update assignment.");
        return;
      }

      toast.success("Assignment updated.");
      closeEdit();
      refetch();
    } catch (err) {
      console.error("Error updating assignment", err);
      toast.error("Something went wrong updating this assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    setDeletingId(assignmentId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assignments/${assignmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete assignment.");
        return;
      }

      toast.success(data.message || "Assignment deleted.");
      setConfirmDelete(null);
      refetch();
    } catch (err) {
      console.error("Error deleting assignment", err);
      toast.error("Something went wrong deleting this assignment.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">All Assignments</h1>
        <p className="text-slate-500 mt-2">Manage and track all course assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<ClipboardList size={22} />} title="Total Assignments" value={assignments.length} accent="bg-slate-100 text-slate-700" />
        <StatCard icon={<FileCheck size={22} />} title="Graded" value={totalGraded} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<Clock size={22} />} title="Pending" value={totalPendingReview} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={<AlertCircle size={22} />} title="Overdue" value={totalOverdue} accent="bg-red-50 text-red-600" />
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
              <option value="Pending Review">Pending Review</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="No Submissions">No Submissions</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading assignments...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-sm font-semibold text-slate-500">Assignment Name</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Course</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Due Date</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Submissions</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500 w-40">Progress</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Status</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((a) => (
                  <tr key={a._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 font-medium text-slate-800">{a.title}</td>
                    <td className="py-4 text-slate-600 text-sm">{a.courseTitle}</td>
                    <td className="py-4 text-slate-600 text-sm">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 text-slate-700 font-medium">{a.submittedCount}/{a.totalStudents}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-700 rounded-full" style={{ width: `${a.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 font-medium w-8">{a.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor[a.status] || "bg-slate-100 text-slate-600"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(a)}
                          title="Edit assignment"
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(a)}
                          title="Delete assignment"
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="text-center text-slate-400 py-8">No assignments found.</p>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Edit Assignment</h3>
              <button onClick={closeEdit} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Total Points</label>
                <input
                  type="number"
                  value={editForm.totalPoints}
                  onChange={(e) => setEditForm({ ...editForm, totalPoints: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Replace attachment file */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Assignment File</label>

                {editing.attachmentUrl && !editFile && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
                    <Paperclip size={14} />
                    <span className="truncate">Current: {editing.originalFileName || "attached file"}</span>
                  </div>
                )}

                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:border-slate-400 transition">
                  <Upload size={20} className="text-slate-400" />
                  <span className="text-sm text-slate-600 text-center">
                    {editFile
                      ? editFile.name
                      : editing.attachmentUrl
                      ? "Click to replace the current file"
                      : "Click to attach a file (optional)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  />
                </label>
                {editFile && (
                  <button
                    type="button"
                    onClick={() => setEditFile(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 mt-1"
                  >
                    Cancel file change
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeEdit} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Assignment?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently delete <span className="font-semibold">{confirmDelete.title}</span> and
              all {confirmDelete.submittedCount} of its submission{confirmDelete.submittedCount !== 1 ? "s" : ""}. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete._id)}
                disabled={deletingId === confirmDelete._id}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {deletingId === confirmDelete._id && <Loader2 size={16} className="animate-spin" />}
                {deletingId === confirmDelete._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
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
