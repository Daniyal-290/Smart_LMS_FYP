"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BookOpen, Users, Clock, ArrowRight } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch courses");
        }
        
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Loading courses...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">My Courses</h1>
        <p className="text-slate-500 mt-2">Manage your currently assigned courses for the term.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          You have not been assigned any courses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition group flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-100 p-3 rounded-xl text-slate-700">
                  <BookOpen size={24} />
                </div>
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-1">{course.title}</h3>
              <p className="text-slate-500 font-medium mb-6">ID: {course._id.substring(course._id.length - 6).toUpperCase()}</p>
              
              <div className="mt-auto space-y-3 mb-6">
                <div className="flex items-center text-slate-600 text-sm gap-3">
                  <Users size={18} className="text-slate-400" />
                  <span>{course.students?.length || 0} Enrolled Students</span>
                </div>
                <div className="flex items-center text-slate-600 text-sm gap-3">
                  <Clock size={18} className="text-slate-400" />
                  <span>{course.credits} Credits</span>
                </div>
              </div>

              <Link href={`/faculty/course/${course._id}`}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-800 text-slate-700 hover:text-white rounded-xl transition font-medium border border-slate-200 hover:border-slate-800"
              >
                Go to Course
                <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
