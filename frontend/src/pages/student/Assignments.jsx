import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function Assignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch assignments");
        }
        
        const data = await res.json();
        setAssignments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, []);

  const badge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Submitted":
        return "bg-emerald-100 text-emerald-700";
      case "Late":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Loading assignments...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Assignments
        </h1>
        <p className="mt-2 text-slate-500">
          Keep track of your coursework and upcoming submission deadlines.
        </p>
      </div>

      {/* Assignment Cards */}
      {assignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-500">
          No assignments found. You are all caught up!
        </div>
      ) : (
        <div className="space-y-5">
          {assignments.map((assignment) => (
            <div
              key={assignment._id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-6"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6">

                {/* Left */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <BookOpen size={17} />
                    <span>{assignment.course?.title || "Unknown Course"}</span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold text-slate-800">
                    {assignment.title}
                  </h2>

                  <p className="mt-3 text-slate-600">
                    {assignment.prompt}
                  </p>

                  <p className="mt-4 text-sm text-slate-500">
                    Instructor: {assignment.course?.instructor?.name || "Unknown"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {assignment.attachmentUrl && (
                    <div className="mt-4">
                      <a
                        href={`http://localhost:5000${assignment.attachmentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                      >
                        <FileText size={16} />
                        Download {assignment.originalFileName || "Attachment"}
                      </a>
                    </div>
                  )}
                </div>

                {/* Right */}
                <div className="flex flex-col items-start lg:items-end justify-between gap-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${badge(
                      assignment.status
                    )}`}
                  >
                    {assignment.status}
                  </span>

                  <div className="flex gap-3">
                    {assignment.status === "Pending" && (
                      <button
                        onClick={() =>
                          navigate(`/student/submit-assignment`, { state: { assignmentId: assignment._id } })
                        }
                        className="rounded-lg bg-slate-800 text-white px-5 py-2 hover:bg-slate-700 transition"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}