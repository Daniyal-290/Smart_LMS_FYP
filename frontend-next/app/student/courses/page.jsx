"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000/api";

export default function MyCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch enrolled courses
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data);

      // Fetch ALL available courses
      const resAll = await fetch(`${API_URL}/courses/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resAll.ok) {
        const allData = await resAll.json();
        const enrolledIds = data.map(c => c._id);
        setAvailableCourses(allData.filter(c => !enrolledIds.includes(c._id)));
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      const res = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ studentId: user._id })
      });
      
      if (res.ok) {
        toast.success("Successfully enrolled in course!");
        fetchData(); // Refresh lists
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to enroll");
      }
    } catch (err) {
      toast.error("Error enrolling in course");
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Loading courses...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 space-y-12">
      {/* My Enrolled Courses Section */}
      <section>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">My Courses</h1>
          <p className="text-slate-600 mt-2">Courses you are currently enrolled in.</p>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
            You are not enrolled in any courses yet. Check available courses below!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
                <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{course.title}</h2>
                <p className="text-sm text-slate-500 mt-1">ID: {course._id.substring(course._id.length - 6).toUpperCase()}</p>
                <div className="border-t border-slate-200 my-5"></div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Instructor</span>
                    <span className="font-medium text-slate-700">{course.instructor?.name || "Pending"}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/student/course/${course._id}`)}
                  className="w-full mt-7 py-3 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900 transition"
                >
                  View Course
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Courses Section */}
      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Available Courses</h2>
          <p className="text-slate-600 mt-2">Register for new courses here.</p>
        </div>

        {availableCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
            No new courses available for registration right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableCourses.map((course) => (
              <div key={course._id} className="bg-white rounded-2xl border border-dashed border-slate-300 bg-slate-50 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{course.title}</h2>
                <p className="text-sm text-slate-500 mt-1">Instructor: {course.instructor?.name || "Unknown"}</p>
                <button
                  onClick={() => handleEnroll(course._id)}
                  className="w-full mt-5 py-2 rounded-xl bg-amber-500 text-slate-900 font-semibold hover:bg-amber-600 transition"
                >
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}