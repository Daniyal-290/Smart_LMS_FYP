"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FileText,
  ClipboardCheck,
  Sparkles,
  BookOpen
} from "lucide-react";
import { toast } from "react-toastify";
const API_URL = "http://localhost:5000/api";

export default function ViewSubmissions() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState(id);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCourse) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/submissions/course/${selectedCourse}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch (err) {
        console.error("Error fetching submissions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedCourse]);

  const autoGrade = (id) => {
    toast.info("Auto grading module is not yet integrated.");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
        
        {/* Back Button */}
        <button
          onClick={() => router.push(`/faculty/course/${id}`)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to Course
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-slate-800 text-white p-4 rounded-2xl">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              View Submissions
            </h1>
            <p className="text-slate-500">
              Review student assignments and quizzes
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <p className="text-slate-500">Total Submissions</p>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">
              {submissions.length}
            </h2>
          </div>
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <p className="text-slate-500">Graded</p>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">
              {submissions.filter(s => s.aiGrade !== null).length}
            </h2>
          </div>
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <p className="text-slate-500">Pending Review</p>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">
              {submissions.filter(s => s.aiGrade === null).length}
            </h2>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 text-left">Assignment</th>
                <th className="px-6 py-4 text-left">Student</th>
                <th className="px-6 py-4">Marks</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">File</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">Loading submissions...</td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">No submissions found for this course.</td>
                </tr>
              ) : (
                submissions.map(item => (
                  <tr key={item._id} className="border-b hover:bg-slate-50 transition">
                    <td className="px-6 py-5 font-semibold text-slate-800">
                      {item.assignment?.title || "Unknown Assignment"}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium">{item.student?.name || "Unknown"}</p>
                      <p className="text-sm text-slate-500">{item.student?.enrollmentId || ""}</p>
                    </td>
                    <td className="text-center font-bold">
                      {item.aiGrade !== null ? `${item.aiGrade}/${item.assignment?.totalPoints || 100}` : "-"}
                    </td>
                    <td className="text-center">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${item.aiGrade !== null ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {item.aiGrade !== null ? "Graded" : "Pending"}
                      </span>
                    </td>
                    <td className="text-center">
                      {item.fileUrl ? (
                        <a href={`http://localhost:5000${item.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View File
                        </a>
                      ) : (
                        <span className="text-slate-400">No File</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => autoGrade(item._id)}
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition"
                      >
                        <Sparkles size={16} />
                        Auto Grade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}