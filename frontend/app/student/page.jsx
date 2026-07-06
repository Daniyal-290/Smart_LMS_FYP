"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { useState, useEffect } from "react";
const API_URL = "http://localhost:5000/api";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        const res = await fetch(`${API_URL}/dashboard/student`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const dashboardData = await res.json();
        setData(dashboardData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  const stats = [
    {
      title: "Enrolled Courses",
      value: data?.enrolledCount || "0",
      icon: <BookOpen size={22} />,
    },
    {
      title: "Pending Assignments",
      value: data?.pendingCount || "0",
      icon: <ClipboardList size={22} />,
    },
    {
      title: "Current GPA",
      value: data?.gpa || "N/A",
      icon: <GraduationCap size={22} />,
    },
    {
      title: "Upcoming Quizzes",
      value: data?.upcomingQuizzes || "0",
      icon: <CalendarDays size={22} />,
    },
  ];

  const attendance = data?.attendance || [];

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome Back, {data?.user?.name || "Student"}!
        </h1>
        <p className="mt-2 text-slate-500">
          {data?.user?.program || "N/A"} • {data?.user?.class || "N/A"}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.title}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {item.title}
                </p>
                <h2 className="text-3xl font-bold text-slate-800 mt-2">
                  {item.value}
                </h2>
              </div>
              <div className="text-slate-500">
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Attendance */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">
          Course Attendance
        </h2>

        {attendance.length === 0 ? (
          <p className="text-slate-500 italic">No attendance data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-3 text-slate-700 font-semibold">Course</th>
                  <th className="py-3 text-slate-700 font-semibold">Attended</th>
                  <th className="py-3 text-slate-700 font-semibold">Total</th>
                  <th className="py-3 text-slate-700 font-semibold">Attendance</th>
                  <th className="py-3 text-slate-700 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((course, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 font-medium text-slate-800">
                      {course.course}
                    </td>
                    <td className="py-4 text-slate-600">
                      {course.attended}
                    </td>
                    <td className="py-4 text-slate-600">
                      {course.total}
                    </td>
                    <td className="py-4 text-slate-600">
                      {course.percentage}%
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          course.percentage >= 90
                            ? "bg-green-100 text-green-700"
                            : course.percentage >= 75
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {course.percentage >= 90
                          ? "Excellent"
                          : course.percentage >= 75
                          ? "Good"
                          : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}