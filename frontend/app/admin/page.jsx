"use client";

import {
  Users,
  GraduationCap,
  UserPlus,
  ArrowRight,
  BookOpen,
  Loader2,
  List,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

export default function AdminDashboard() {

  const router = useRouter();
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0 });
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const [sRes, cRes] = await Promise.all([
          fetch(`${API_URL}/auth/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/courses/all`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (sRes.ok) {
          const data = await sRes.json();
          const courses = cRes.ok ? await cRes.json() : [];
          setStats({ students: data.students, teachers: data.teachers, courses: courses.length });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const nav = (key, path) => {
    setNavigating(key);
    router.push(path);
  };

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
              Manage university students, faculty, and courses.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard icon={<GraduationCap size={25}/>} title="Total Students" value={loading ? "..." : stats.students} color="amber" />
        <StatCard icon={<Users size={25}/>} title="Total Teachers" value={loading ? "..." : stats.teachers} color="indigo" />
        <StatCard icon={<BookOpen size={25}/>} title="Total Courses" value={loading ? "..." : stats.courses} color="emerald" />
      </div>

      {/* Registration Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-5">
          Registration
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <ActionButton
            label="Register Student"
            icon={navigating === "reg-student" ? <Loader2 size={22} className="animate-spin" /> : <UserPlus size={22}/>}
            loading={navigating === "reg-student"}
            onClick={() => nav("reg-student", "/admin/register-student")}
          />

          <ActionButton
            label="Register Teacher"
            icon={navigating === "reg-teacher" ? <Loader2 size={22} className="animate-spin" /> : <UserPlus size={22}/>}
            loading={navigating === "reg-teacher"}
            onClick={() => nav("reg-teacher", "/admin/register-teacher")}
          />

          <ActionButton
            label="Assign Course"
            icon={navigating === "assign-course" ? <Loader2 size={22} className="animate-spin" /> : <BookOpen size={22}/>}
            loading={navigating === "assign-course"}
            onClick={() => nav("assign-course", "/admin/assign-course")}
          />

        </div>
      </div>

      {/* Management Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-5">
          Manage Records
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <ActionButton
            label="Manage Students"
            icon={navigating === "students" ? <Loader2 size={22} className="animate-spin" /> : <Users size={22}/>}
            loading={navigating === "students"}
            onClick={() => nav("students", "/admin/students")}
            variant="outline"
          />

          <ActionButton
            label="Manage Teachers"
            icon={navigating === "teachers" ? <Loader2 size={22} className="animate-spin" /> : <GraduationCap size={22}/>}
            loading={navigating === "teachers"}
            onClick={() => nav("teachers", "/admin/teachers")}
            variant="outline"
          />

          <ActionButton
            label="Manage Courses"
            icon={navigating === "courses" ? <Loader2 size={22} className="animate-spin" /> : <List size={22}/>}
            loading={navigating === "courses"}
            onClick={() => nav("courses", "/admin/courses")}
            variant="outline"
          />

        </div>
      </div>

    </div>
  );
}


function StatCard({ icon, title, value, color = "slate" }) {
  const colorMap = {
    amber: "bg-amber-100 text-amber-700",
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <h2 className="text-3xl font-bold text-slate-800">{value}</h2>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, onClick, loading, variant = "solid" }) {
  const base = "flex items-center justify-between p-5 rounded-xl transition disabled:opacity-50 w-full";
  const solid = "bg-slate-800 text-white hover:bg-slate-700";
  const outline = "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${base} ${variant === "solid" ? solid : outline}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      <ArrowRight size={20}/>
    </button>
  );
}

