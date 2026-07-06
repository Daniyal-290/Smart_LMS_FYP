"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function SubmitAssignment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const assignmentId = searchParams.get("assignmentId");

  useEffect(() => {
    if (!assignmentId) {
      toast.error("Invalid assignment selected.");
      router.push("/student/assignments");
    }
  }, [assignmentId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !content.trim()) {
      toast.error("Please provide either text content or a file attachment.");
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("Max limit is 5 MB");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("assignmentId", assignmentId);
      formData.append("content", content);
      if (file) {
        formData.append("file", file);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/submissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Assignment submitted successfully!");
        router.push("/student/assignments");
      } else {
        toast.error(data.message || "Failed to submit assignment.");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!assignmentId) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-slate-100 p-3 rounded-xl text-slate-700">
            <UploadCloud size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Submit Assignment
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Upload your work before the deadline.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors bg-slate-50">
            <input
              type="file"
              id="fileUpload"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              <div className="bg-white p-4 rounded-full shadow-sm border border-slate-200 text-slate-600">
                <UploadCloud size={28} />
              </div>
              <div>
                <p className="font-semibold text-slate-700">
                  Click to upload a file
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  PDF, DOCX, ZIP (Max 5MB)
                </p>
              </div>
            </label>
            
            {file && (
              <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 font-medium bg-emerald-50 py-2 px-4 rounded-lg inline-flex">
                <CheckCircle2 size={18} />
                {file.name} attached
              </div>
            )}
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Comments / Text Submission (Optional)
            </label>
            <textarea
              rows={5}
              placeholder="Type your answer or comments here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push("/student/assignments")}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Submitting..." : "Submit Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}