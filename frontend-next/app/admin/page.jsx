"use client";

import {
  Users,
  GraduationCap,
  UserPlus,
  ArrowRight,
  BookOpen
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

export default function AdminDashboard() {

  const router = useRouter();
  const [stats, setStats] = useState({ students: 0, teachers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/auth/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-4 rounded-xl text-slate-700">
            <Users size={30}/>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-2">
              Manage university students and faculty registrations.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <StatCard icon={<GraduationCap size={25}/>} title="Total Students" value={loading ? "..." : stats.students} />
        <StatCard icon={<Users size={25}/>} title="Total Teachers" value={loading ? "..." : stats.teachers} />
      </div>

      {/* Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <button
            onClick={() => router.push("/admin/register-student")}
            className="flex items-center justify-between bg-slate-800 text-white p-5 rounded-xl hover:bg-slate-700 transition"
          >
            <div className="flex items-center gap-3">
              <UserPlus size={22}/>
              Register Student
            </div>
            <ArrowRight size={20}/>
          </button>

          <button
            onClick={() => router.push("/admin/register-teacher")}
            className="flex items-center justify-between bg-slate-800 text-white p-5 rounded-xl hover:bg-slate-700 transition"
          >
            <div className="flex items-center gap-3">
              <UserPlus size={22}/>
              Register Teacher
            </div>
            <ArrowRight size={20}/>
          </button>

          <button
            onClick={() => router.push("/admin/assign-course")}
            className="flex items-center justify-between bg-slate-800 text-white p-5 rounded-xl hover:bg-slate-700 transition"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={22}/>
              Assign Course
            </div>
            <ArrowRight size={20}/>
          </button>

        </div>
      </div>

    </div>
  );
}


function StatCard({icon,title,value}){
  return(
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className="bg-slate-100 p-3 rounded-xl text-slate-700">
          {icon}
        </div>
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <h2 className="text-3xl font-bold text-slate-800">{value}</h2>
        </div>
      </div>
    </div>
  )
}
