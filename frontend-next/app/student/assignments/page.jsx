"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Filter,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function Assignments() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [assignmentsRes, coursesRes] = await Promise.all([
          fetch(`${API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (!assignmentsRes.ok || !coursesRes.ok) {
          throw new Error("Failed to fetch data");
        }
        
        const [assignmentsData, coursesData] = await Promise.all([
          assignmentsRes.json(),
          coursesRes.json()
        ]);

        setAssignments(assignmentsData);
        setCourses(coursesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  // (removed uniqueCourses calculation since we fetch real courses now)

  const filteredAssignments = selectedCourse === "All" 
    ? assignments 
    : assignments.filter(a => a.course?._id === selectedCourse);

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

      {/* Filter Section */}
      {courses.length > 0 && (
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <Filter size={20} className="text-slate-500" />
          <span className="font-medium text-slate-700">Filter by Course:</span>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="flex-1 max-w-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500 text-sm"
          >
            <option value="All">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Assignment Cards */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-500">
          No assignments uploaded as of now.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredAssignments.map((assignment) => (
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
                          router.push(`/student/submit-assignment?assignmentId=${assignment._id}`)
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