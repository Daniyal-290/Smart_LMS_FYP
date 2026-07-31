"use client";

import { useState } from "react";
import { BookOpen, Hash, GraduationCap, FileText, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api";

export default function CreateCourse() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    courseCode: "",
    credits: 3,
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "credits" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // No instructorId sent — the backend leaves the course unassigned.
      // An instructor can be assigned later from Manage Courses (Edit).
      const res = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create course");

      toast.success(`"${formData.title}" created. Assign an instructor from Manage Courses when ready.`);
      setFormData({ title: "", courseCode: "", credits: 3, description: "" });
      router.push("/admin/courses");
    } catch (err) {
      toast.error(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-100 p-4 rounded-xl text-slate-700">
            <BookOpen size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Create Course</h1>
            <p className="text-slate-500 mt-2">
              Add a new course without assigning an instructor yet — you can assign one later from Manage Courses.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BookOpen size={16} /> Course Title
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Database Systems"
              className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Hash size={16} /> Course Code
              </label>
              <input
                type="text"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleChange}
                placeholder="e.g. CS-301"
                className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <GraduationCap size={16} /> Credits
              </label>
              <input
                type="number"
                name="credits"
                min="1"
                max="6"
                value={formData.credits}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText size={16} /> Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional course description"
              className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Creating..." : "Create Course"}
          </button>
        </form>
      </div>
    </div>
  );
}
