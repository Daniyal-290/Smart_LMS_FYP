import { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  Users,
  ClipboardList,
  FileQuestion,
  CalendarCheck,
  Upload,
  Plus,
  Pencil,
  Eye,
  Download,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import QuickActions from "./QuickActions";

const API_URL = "http://localhost:5000/api";

export default function ViewCourse() {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course;

  const [assignments, setAssignments] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLectures, setLoadingLectures] = useState(true);

  // If no course in state, bounce back
  useEffect(() => {
    if (!course) {
      navigate("/faculty/courses");
    }
  }, [course, navigate]);

  useEffect(() => {
    if (!course) return;

    const fetchCourseData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch assignments for this specific course
        const res = await fetch(`${API_URL}/assignments/course/${course._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
        }

        // Fetch lectures
        const resLectures = await fetch(`${API_URL}/lectures/course/${course._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (resLectures.ok) {
          const dataLectures = await resLectures.json();
          setLectures(dataLectures);
        }

      } catch (err) {
        console.error("Failed to fetch course data:", err);
      } finally {
        setLoading(false);
        setLoadingLectures(false);
      }
    };

    fetchCourseData();
  }, [course]);

  if (!course) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate("/faculty/courses")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
      >
        <ArrowLeft size={18} />
        Back to Courses
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {course.title}
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              ID: {course._id.substring(course._id.length - 6).toUpperCase()} • {course.credits} Credits
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition">
              <Pencil size={18} />
              Edit Course
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <Users className="text-blue-600 mb-3" size={30} />
          <h2 className="text-3xl font-bold text-slate-800">{course.students?.length || 0}</h2>
          <p className="text-slate-500 font-medium">Enrolled Students</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <ClipboardList className="text-green-600 mb-3" size={30} />
          <h2 className="text-3xl font-bold text-slate-800">{assignments.length}</h2>
          <p className="text-slate-500 font-medium">Assignments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <FileQuestion className="text-purple-600 mb-3" size={30} />
          <h2 className="text-3xl font-bold text-slate-800">0</h2>
          <p className="text-slate-500 font-medium">Quizzes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <CalendarCheck className="text-orange-600 mb-3" size={30} />
          <h2 className="text-3xl font-bold text-slate-800">N/A</h2>
          <p className="text-slate-500 font-medium">Attendance</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Course Description */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Course Description
            </h2>
            <p className="text-slate-600 leading-7">
              {course.description || "No description provided for this course yet."}
            </p>
          </div>

          {/* Lecture Materials */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800">
                Lecture Materials
              </h2>
              <button className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition">
                <Upload size={18} />
                Upload
              </button>
            </div>
            
            {loadingLectures ? (
              <div className="text-center py-8 text-slate-500">Loading lecture notes...</div>
            ) : lectures.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No lecture materials uploaded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {lectures.map((lecture) => (
                  <div key={lecture._id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{lecture.title}</h3>
                        <p className="text-xs text-slate-500">{new Date(lecture.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a
                      href={`http://localhost:5000${lecture.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition text-sm font-medium"
                    >
                      <Download size={16} />
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800">
                Assignments
              </h2>
              <button 
                onClick={() => navigate(`/faculty/course/${course._id}/assignments`, { state: { course } })}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
              >
                <Plus size={18} />
                Create
              </button>
            </div>

            {loading ? (
              <div className="text-center py-6 text-slate-500">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No assignments created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                          {assignment.totalPoints} Points
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />

          {/* Course Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-5">
              Course Information
            </h2>
            <div className="space-y-4 text-slate-600">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Course Code</span>
                <span className="font-semibold text-slate-800">{course._id.substring(course._id.length - 6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Credit Hours</span>
                <span className="font-semibold text-slate-800">{course.credits}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Enrolled</span>
                <span className="font-semibold text-slate-800">{course.students?.length || 0} Students</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-slate-500">Status</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs">Active</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}