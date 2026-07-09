"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Search, Pencil, Trash2, Loader2, X, Check, ChevronUp, ChevronDown, UserPlus, BookOpen
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

export default function ManageTeachers() {
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [editTeacher, setEditTeacher] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [tRes, cRes] = await Promise.all([
        fetch(`${API_URL}/auth/instructors`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/courses/all`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!tRes.ok) throw new Error("Failed to fetch teachers");
      const tData = await tRes.json();
      const cData = cRes.ok ? await cRes.json() : [];
      setTeachers(tData);
      setCourses(cData);
    } catch (err) {
      toast.error("Could not load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Map teacher id -> assigned courses
  const teacherCourses = useMemo(() => {
    const map = {};
    courses.forEach(c => {
      const instrId = c.instructor?._id || c.instructor;
      if (instrId) {
        if (!map[instrId]) map[instrId] = [];
        map[instrId].push(c.title);
      }
    });
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    let list = teachers.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      const va = (a[sortField] || "").toString().toLowerCase();
      const vb = (b[sortField] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [teachers, search, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const openEdit = (t) => {
    setEditTeacher(t);
    setEditForm({ name: t.name, email: t.email });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/teachers/${editTeacher._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTeachers(prev => prev.map(t => t._id === editTeacher._id ? { ...t, ...editForm } : t));
      toast.success("Teacher updated!");
      setEditTeacher(null);
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
      const res = await fetch(`${API_URL}/auth/teachers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTeachers(prev => prev.filter(t => t._id !== id));
      toast.success("Teacher deleted");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={14} className="text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <Users size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Manage Teachers</h1>
              <p className="text-slate-500 text-sm mt-1">{teachers.length} total teachers registered</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/register-teacher")}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition font-medium text-sm"
          >
            <UserPlus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[["name","Name"],["email","Email"]].map(([field, label]) => (
                    <th key={field}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition"
                      onClick={() => handleSort(field)}
                    >
                      <span className="flex items-center gap-1">{label}<SortIcon field={field} /></span>
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Courses</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => {
                  const assignedCourses = teacherCourses[t._id] || [];
                  return (
                    <tr key={t._id} className="hover:bg-slate-50 transition group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{t.email}</td>
                      <td className="px-5 py-4">
                        {assignedCourses.length === 0 ? (
                          <span className="text-slate-400 text-xs">No courses assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedCourses.map((c, i) => (
                              <span key={i} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                <BookOpen size={11} />{c}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setConfirmDelete(t._id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Edit Teacher</h2>
              <button onClick={() => setEditTeacher(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: "name", label: "Full Name", type: "text" },
                { key: "email", label: "Email Address", type: "email" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input
                    type={type}
                    value={editForm[key] || ""}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setEditTeacher(null)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl hover:bg-slate-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-500 text-white py-2.5 rounded-xl hover:bg-indigo-600 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
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
            <h2 className="text-lg font-bold text-slate-800 mb-2">Delete Teacher?</h2>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone. The teacher record will be permanently removed.</p>
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
