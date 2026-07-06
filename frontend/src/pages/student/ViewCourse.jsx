import { Download, FileQuestion, ArrowLeft, BookOpen, Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
const API_URL = "http://localhost:5000/api";

export default function ViewCourse() {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course;

  const [showToast, setShowToast] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(true);

  useEffect(() => {
    if (!course) {
      navigate("/student/courses");
      return;
    }

    const fetchLectures = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/lectures/course/${course._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLectures(data);
        }
      } catch (error) {
        console.error("Error fetching lectures:", error);
      } finally {
        setLoadingLectures(false);
      }
    };

    fetchLectures();
  }, [course, navigate]);

  const handleDownload = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  if (!course) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl shadow-md z-50 flex items-center gap-2 transition">
          <Download size={17} className="text-slate-500" />
          <span className="text-sm font-medium">Downloading lecture notes...</span>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate("/student/courses")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6"
      >
        <ArrowLeft size={18} />
        Back to Courses
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          {course.title}
        </h1>
        <p className="mt-2 text-slate-500 font-medium">
          ID: {course._id.substring(course._id.length - 6).toUpperCase()} • {course.credits} Credits
        </p>
        {course.instructor && (
          <p className="mt-2 text-sm text-slate-600">
            Instructor: <span className="font-semibold">{course.instructor.name}</span>
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notes Section */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-slate-700" size={24} />
              <h2 className="text-2xl font-bold text-slate-800">
                Lecture Materials
              </h2>
            </div>

            {loadingLectures ? (
              <div className="text-center py-10 text-slate-500">Loading lecture notes...</div>
            ) : lectures.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                No lecture notes have been uploaded by the instructor yet.
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
                      onClick={handleDownload}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition text-sm font-medium"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          
          {/* Course Description */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 text-slate-800">
              <Info size={20} />
              <h2 className="text-lg font-bold">Course Overview</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              {course.description || "No description provided for this course yet."}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}