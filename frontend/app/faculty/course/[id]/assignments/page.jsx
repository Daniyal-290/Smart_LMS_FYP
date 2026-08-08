"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
const API_URL = "http://localhost:5000/api";

export default function CreateAssignment() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState((id && id.length === 24) ? id : "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);
  const [totalPoints, setTotalPoints] = useState(100);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
          if (data.length > 0 && (!id || id.length !== 24)) {
            setSelectedCourse(data[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching courses", err);
      }
    };
    fetchCourses();
  }, [id]);

  const handleCreate = async () => {
    if (!selectedCourse || !title.trim() || !instructions.trim() || !deadline) {
      toast.error("Please fill in all the required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("courseId", selectedCourse);
    formData.append("title", title);
    formData.append("prompt", instructions);
    formData.append("dueDate", deadline);
    formData.append("totalPoints", totalPoints);
    if (file) {
      formData.append("file", file);
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assignments`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Assignment created successfully!");
        router.push("/faculty/courses");
      } else {
        toast.error(data.message || "Failed to create assignment");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardCheck className="text-slate-700" size={28} />
          <h1 className="text-3xl font-bold text-slate-800">
            Create Assignment
          </h1>
        </div>

        <div className="space-y-6">

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {courses.length === 0 && <option value="">Loading courses...</option>}
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </div>

          {/* Assignment Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assignment Title
            </label>
            <input
              type="text"
              placeholder="Enter assignment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instructions / Prompt
            </label>
            <textarea
              rows={6}
              placeholder="Enter assignment instructions..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Attach File (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50"
            />
          </div>

          {/* Grid for Deadline and Total Marks */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Marks / Points
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={totalPoints}
                onChange={(e) => setTotalPoints(Number(e.target.value))}
                placeholder="e.g. 100, 50, 20"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || courses.length === 0}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Creating..." : "Create Assignment"}
          </button>

        </div>
      </div>
    </div>
  );
}