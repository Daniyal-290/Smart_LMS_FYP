"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "react-toastify";
const API_URL = "http://localhost:5000/api";

export default function UploadLectureNotes() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast.error("Please enter the lecture title and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("courseId", id);
    formData.append("file", file);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/lectures`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Lecture uploaded successfully!");
        router.push(`/faculty/course/${id}`);
      } else {
        toast.error(data.message || "Failed to upload lecture.");
      }
    } catch (error) {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-slate-700" size={28} />
          <h1 className="text-3xl font-bold text-slate-800">
            Upload Lecture Notes
          </h1>
        </div>

        <div className="space-y-5">
          {/* Lecture Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lecture Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lecture title"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload Lecture File
            </label>

            <input
              id="lecture-file"
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border border-slate-300 rounded-lg px-4 py-3"
            />

            <p className="text-sm text-slate-500 mt-2">
              Supported formats: PDF, PPT, PPTX, DOC, DOCX
            </p>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}