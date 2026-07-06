"use client";

import { useRouter, useParams } from "next/navigation";
import { Download, ArrowLeft, BookOpen, Info, Megaphone, CalendarClock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
const API_URL = "http://localhost:5000/api";

export default function ViewCourse() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCourseAndLectures = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch Course Details
        const courseRes = await fetch(`${API_URL}/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourse(courseData);
        } else {
          // If course not found or error, redirect back
          router.push("/student/courses");
          return;
        }

        // Fetch Lectures
        const lecturesRes = await fetch(`${API_URL}/lectures/course/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (lecturesRes.ok) {
          const lecturesData = await lecturesRes.json();
          setLectures(lecturesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingCourse(false);
        setLoadingLectures(false);
      }
    };

    fetchCourseAndLectures();
  }, [id, router]);

  const handleDownload = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  if (loadingCourse) {
    return <div className="text-center py-10 text-slate-500">Loading course...</div>;
  }

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
        onClick={() => {
          setNavLoading(true);
          router.push("/student/courses");
        }}
        disabled={navLoading}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6 disabled:opacity-50"
      >
        {navLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} />}
        {navLoading ? "Loading..." : "Back to Courses"}
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-8 mb-8 text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-2xl"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-32 h-32 rounded-full bg-blue-400 opacity-10 blur-xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-xs font-semibold tracking-wider text-slate-300 mb-4">
              {course.courseCode || `ID: ${course._id.substring(course._id.length - 6).toUpperCase()}`}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              {course.title}
            </h1>
            {course.instructor && (
              <p className="text-slate-300 font-medium flex items-center gap-2">
                Instructor: <span className="text-white font-semibold">{course.instructor.name}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl">
            <span className="text-2xl font-bold text-white">{course.credits}</span>
            <span className="text-sm text-slate-400 font-medium">Credits</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column - Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Announcements Section */}
          <section className="bg-white border border-blue-100 rounded-2xl shadow-sm p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center gap-3 mb-6">
              <Megaphone className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-slate-800">
                Announcements
              </h2>
            </div>
            
            {!course.announcements || course.announcements.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                No new announcements.
              </div>
            ) : (
              <div className="space-y-4">
                {course.announcements.map((announcement, idx) => (
                  <div key={idx} className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800">Important Update</h3>
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                        <CalendarClock size={14} />
                        {new Date(announcement.date).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {announcement.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          {/* Notes Section */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-slate-700" size={24} />
              <h2 className="text-xl font-bold text-slate-800">
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