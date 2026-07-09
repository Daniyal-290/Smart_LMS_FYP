"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Search, Pencil, Trash2, Loader2, X, Check, ChevronUp, ChevronDown, Plus, Users
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

export default function ManageCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [editCourse, setEditCourse] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cRes, tRes] = await Promise.all([
        fetch(`${API_URL}/courses/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/auth/instructors`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!cRes.ok) throw new Error("Failed to fetch courses");
      const cData = await cRes.json();
      const tData = tRes.ok ? await tRes.json() : [];
      setCourses(cData);
      setTeachers(tData);
    } catch (err) {
      toast.error("Could not load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let list = courses.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.courseCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor?.name || "").toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      let va, vb;
      if (sortField === "instructor") {
        va = (a.instructor?.name || "").toLowerCase();
        vb = (b.instructor?.name || "").toLowerCase();
      } else if (sortField === "students") {
        va = a.students?.length || 0;
        vb = b.students?.length || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      } else {
        va = (a[sortField] || "").toString().toLowerCase();
        vb = (b[sortField] || "").toString().toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [courses, search, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setEditForm({
      title: c.title,
      courseCode: c.courseCode || "",
      credits: c.credits || 3,
      description: c.description || "",
      instructorId: c.instructor?._id || c.instructor || "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/courses/${editCourse._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Merge updated course back (preserve students array)
      const updatedCourse = data.course;
      setCourses(prev => prev.map(c => c._id === editCourse._id ? { ...c, ...updatedCourse } : c));
      toast.success("Course updated!");
      setEditCourse(null);
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCourses(prev => prev.filter(c => c._id !== id));
      toast.success("Course deleted");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={14} className="text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <BookOpen size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Manage Courses</h1>
              <p className="text-slate-500 text-sm mt-1">{courses.length} total courses available</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/assign-course")}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition font-medium text-sm"
          >
            <Plus size={16} /> Create Course
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, course code or instructor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    ["courseCode","Course Code"],
                    ["title","Title"],
                    ["credits","Credits"],
                    ["instructor","Instructor"],
                    ["students","Students"],
                  ].map(([field, label]) => (
                    <th key={field}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition"
                      onClick={() => handleSort(field)}
                    >
                      <span className="flex items-center gap-1">{label}<SortIcon field={field} /></span>
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50 transition group">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{c.courseCode || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <BookOpen size={14} />
                        </div>
                        <span className="font-medium text-slate-800">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{c.credits || 3} cr</td>
                    <td className="px-5 py-4">
                      {c.instructor ? (
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          {c.instructor.name || c.instructor}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Users size={13} className="text-slate-400" />
                        {c.students?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setConfirmDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Edit Course</h2>
              <button onClick={() => setEditCourse(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Course Title</label>
                <input type="text" value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Course Code</label>
                  <input type="text" value={editForm.courseCode || ""} onChange={e => setEditForm(f => ({ ...f, courseCode: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Credits</label>
                  <input type="number" min="1" max="6" value={editForm.credits || 3} onChange={e => setEditForm(f => ({ ...f, credits: parseInt(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea rows={3} value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Assign Instructor</label>
                <select value={editForm.instructorId || ""} onChange={e => setEditForm(f => ({ ...f, instructorId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">— Select Instructor —</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setEditCourse(null)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl hover:bg-slate-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl hover:bg-emerald-600 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Delete Course?</h2>
            <p className="text-slate-500 text-sm mb-6">This will permanently remove the course and all its data.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl hover:bg-slate-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting === confirmDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl hover:bg-red-600 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {deleting === confirmDelete ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleting === confirmDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
