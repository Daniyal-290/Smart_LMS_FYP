"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GraduationCap, Search, Pencil, Trash2, Loader2, X, Check, ChevronUp, ChevronDown, UserPlus
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

export default function ManageStudents() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      toast.error("Could not load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = useMemo(() => {
    let list = students.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.enrollmentId || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.program || "").toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      const va = (a[sortField] || "").toString().toLowerCase();
      const vb = (b[sortField] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [students, search, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setEditForm({ name: s.name, email: s.email, enrollmentId: s.enrollmentId || "", class: s.class || "", program: s.program || "" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/students/${editStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStudents(prev => prev.map(s => s._id === editStudent._id ? { ...s, ...editForm } : s));
      toast.success("Student updated!");
      setEditStudent(null);
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
      const res = await fetch(`${API_URL}/auth/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStudents(prev => prev.filter(s => s._id !== id));
      toast.success("Student deleted");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={14} className="text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <GraduationCap size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Manage Students</h1>
              <p className="text-slate-500 text-sm mt-1">{students.length} total students registered</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/register-student")}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition font-medium text-sm"
          >
            <UserPlus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, enrollment ID or program..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[["name","Name"],["enrollmentId","Enrollment ID"],["email","Email"],["class","Class"],["program","Program"]].map(([field, label]) => (
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
                {filtered.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50 transition group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{s.enrollmentId || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{s.email}</td>
                    <td className="px-5 py-4 text-slate-600">{s.class || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{s.program || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setConfirmDelete(s._id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition" title="Delete">
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
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Edit Student</h2>
              <button onClick={() => setEditStudent(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: "name", label: "Full Name", type: "text" },
                { key: "email", label: "Email Address", type: "email" },
                { key: "enrollmentId", label: "Enrollment ID", type: "text" },
                { key: "class", label: "Class", type: "text" },
                { key: "program", label: "Program", type: "text" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input
                    type={type}
                    value={editForm[key] || ""}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setEditStudent(null)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl hover:bg-slate-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl hover:bg-amber-600 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
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
            <h2 className="text-lg font-bold text-slate-800 mb-2">Delete Student?</h2>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone. The student record will be permanently removed.</p>
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
