"use client";

import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Building2,
  Hash,
  UserCircle,
} from "lucide-react";

export default function WelcomeBanner() {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

      <div className="flex flex-col xl:flex-row gap-10">

        {/* Left Side */}

        <div className="flex gap-6">

          <img
            src="/images/student.jpg"
            alt="Student"
            className="w-28 h-28 rounded-xl border border-slate-300 object-cover"
          />

          <div>

            <p className="text-sm uppercase tracking-widest text-slate-500">
              Student Profile
            </p>

            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Bakhtawar Abro
            </h1>

            <p className="text-slate-600 mt-2">
              Welcome back! Here&apos;s a quick overview of your academic profile.
            </p>

            <div className="flex flex-wrap gap-3 mt-5">

              <span className="px-4 py-2 bg-slate-100 rounded-lg text-sm border border-slate-200">
                Student ID: <strong>22-CS-123</strong>
              </span>

              <span className="px-4 py-2 bg-slate-100 rounded-lg text-sm border border-slate-200">
                Roll No: <strong>CS-22045</strong>
              </span>

              <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200">
                Active
              </span>

            </div>

          </div>

        </div>

        {/* Academic Information */}

        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">

          <InfoCard
            icon={<GraduationCap size={18} />}
            title="Program"
            value="BS Computer Science"
          />

          <InfoCard
            icon={<Building2 size={18} />}
            title="Department"
            value="Computer Science"
          />

          <InfoCard
            icon={<Hash size={18} />}
            title="Semester"
            value="6th"
          />

          <InfoCard
            icon={<UserCircle size={18} />}
            title="Section"
            value="B"
          />

          <InfoCard
            icon={<Calendar size={18} />}
            title="Batch"
            value="2022 - 2026"
          />

          <InfoCard
            icon={<GraduationCap size={18} />}
            title="CGPA"
            value="3.54 / 4.00"
          />

        </div>

      </div>

      {/* Contact Information */}

      <div className="border-t border-slate-200 mt-8 pt-8">

        <h3 className="text-lg font-semibold text-slate-800 mb-5">
          Contact Information
        </h3>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <DetailCard
            icon={<Mail size={18} />}
            title="University Email"
            value="bakhtawar@smartlms.edu.pk"
          />

          <DetailCard
            icon={<Phone size={18} />}
            title="Phone Number"
            value="+92 300 1234567"
          />

          <DetailCard
            icon={<Calendar size={18} />}
            title="Admission Date"
            value="September 2022"
          />

          <DetailCard
            icon={<MapPin size={18} />}
            title="Campus"
            value="Main Campus"
          />

        </div>

      </div>

    </section>
  );
}

function InfoCard({ icon, title, value }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">

      <div className="flex items-center gap-2 text-slate-500 mb-2">
        {icon}
        <span className="text-sm">{title}</span>
      </div>

      <h3 className="font-semibold text-slate-800">
        {value}
      </h3>

    </div>
  );
}

function DetailCard({ icon, title, value }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white flex gap-3">

      <div className="text-slate-600 mt-1">
        {icon}
      </div>

      <div>

        <p className="text-sm text-slate-500">
          {title}
        </p>

        <p className="font-medium text-slate-800 mt-1">
          {value}
        </p>

      </div>

    </div>
  );
}
