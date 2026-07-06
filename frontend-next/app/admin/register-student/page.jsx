"use client";

import { useState } from "react";
import { User, Mail, Hash, BookOpen, Lock, GraduationCap } from "lucide-react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000/api";

export default function RegisterStudent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    enrollmentId: "",
    class: "",
    program: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/register-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          enrollmentId: formData.enrollmentId,
          class: formData.class,
          program: formData.program,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register student");
      }

      setSuccess("Student registered successfully!");
      setFormData({
        name: "",
        email: "",
        enrollmentId: "",
        class: "",
        program: "",
        password: "",
        confirmPassword: "",
      });
      toast?.success?.("Student registered successfully");
    } catch (err) {
      setError(err.message);
      toast?.error?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-slate-800 p-4 rounded-full shadow-lg mb-4">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 text-center">
          Register Student
        </h1>
        <p className="text-slate-500 mt-2 text-center">
          Create a new student account in the system
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Full Name */}
        <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
            <User size={18} />
          </div>
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="w-full bg-transparent pl-8 py-3 outline-none text-slate-800 placeholder-slate-500" />
        </div>

        {/* Email */}
        <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
            <Mail size={18} />
          </div>
          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="w-full bg-transparent pl-8 py-3 outline-none text-slate-800 placeholder-slate-500" />
        </div>

        {/* Enrollment ID */}
        <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
            <Hash size={18} />
          </div>
          <input type="text" name="enrollmentId" placeholder="Enrollment ID (e.g. SP26-BCS-041)" value={formData.enrollmentId} onChange={handleChange} required className="w-full bg-transparent pl-8 py-3 outline-none text-slate-800 placeholder-slate-500" />
        </div>

        {/* Class */}
        <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
            <BookOpen size={18} />
          </div>
          <input type="text" name="class" placeholder="Class (e.g. BSCS-6A)" value={formData.class} onChange={handleChange} required className="w-full bg-transparent pl-8 py-3 outline-none text-slate-800 placeholder-slate-500" />
        </div>

        {/* Program */}
        <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
            <BookOpen size={18} />
          </div>
          <input type="text" name="program" placeholder="Program (e.g. BS Computer Science)" value={formData.program} onChange={handleChange} required className="w-full bg-transparent pl-8 py-3 outline-none text-slate-800 placeholder-slate-500" />
        </div>

        {/* Password */}
        <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
            <Lock size={18} />
          </div>
          <input type="password" name="password" placeholder="Password (min 6 characters)" value={formData.password} onChange={handleChange} required className="w-full bg-transparent pl-8 py-3 outline-none text-slate-800 placeholder-slate-500" />
        </div>

        {/* Confirm Password */}
        <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
            <Lock size={18} />
          </div>
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required className="w-full bg-transparent pl-8 py-3 outline-none text-slate-800 placeholder-slate-500" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#f5b842] hover:bg-[#e0a631] text-slate-900 font-semibold px-6 py-4 rounded-xl mt-6 transition-colors shadow-sm disabled:opacity-50">
          {loading ? "Registering..." : "Register Student"}
        </button>
      </form>
    </div>
  );
}
