"use client";

import { useRouter } from "next/navigation";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";

import PortalCard from "@/components/PortalCard";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Landing() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(null);
  return (
    <div 
      className="min-h-screen px-6 py-8 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(/images/landing-bg.jpg)` }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
      <main className="max-w-7xl mx-auto pt-16 relative z-10">

        {/* Banner Text */}
        <div 
          className="mb-16 text-left max-w-3xl mt-12 md:mt-24"
          style={{ fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
        >
          <h1 className="text-5xl md:text-[5.5rem] font-bold text-slate-300 uppercase leading-[1.05] drop-shadow-2xl">
            Select Your<br/>Portal.
          </h1>
          <p className="mt-6 text-xl md:text-2xl font-bold text-slate-400 uppercase drop-shadow-md tracking-wide">
            Smart LMS Ecosystem
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mt-10">

          {/* Student Portal */}
          <PortalCard
            icon={navigating === "student" ? <Loader2 size={35} className="animate-spin" /> : <MenuBookIcon fontSize="large" />}
            title="Student Portal"
            description="Access courses, assignments, grades and announcements."
            onClick={() => {
              setNavigating("student");
              router.push("/login/student");
            }}
            loading={navigating === "student"}
          />

          {/* Faculty Portal */}
          <PortalCard
            icon={navigating === "faculty" ? <Loader2 size={35} className="animate-spin" /> : <SchoolIcon fontSize="large" />}
            title="Faculty Portal"
            description="Manage courses, assignments, attendance and AI grading."
            onClick={() => {
              setNavigating("faculty");
              router.push("/login/faculty");
            }}
            loading={navigating === "faculty"}
          />

          {/* Admin Portal */}
          <PortalCard
            icon={navigating === "admin" ? <Loader2 size={35} className="animate-spin" /> : <GroupsIcon fontSize="large" />}
            title="Admin Portal"
            description="Manage users, departments and system settings."
            onClick={() => {
              setNavigating("admin");
              router.push("/login/admin");
            }}
            loading={navigating === "admin"}
          />

        </div>

        {/* Support */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-300 drop-shadow-md font-medium">
            Need help signing in? Contact your university IT support.
          </p>
        </div>

      </main>
    </div>
  );
}
