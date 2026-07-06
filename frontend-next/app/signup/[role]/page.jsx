"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { GraduationCap, User, Lock, Mail, Hash, BookOpen } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function Signup() {
  const router = useRouter();
  const params = useParams();
  const role = params.role;

  useEffect(() => {
    if (role !== "student") {
      router.push("/");
    }
  }, [role, router]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    enrollmentId: "",
    class: "",
    program: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Map URL role to backend role enum
  const backendRole = role === "faculty" ? "Instructor" : "Student";
  const portalName = role
    ? `${role.charAt(0).toUpperCase()}${role.slice(1)} Signup`
    : "Sign Up";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
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
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: backendRole,
          enrollmentId: formData.enrollmentId,
          class: formData.class,
          program: formData.program,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      }));

      // Navigate to the appropriate dashboard
      if (data.role === "Student") {
        router.push("/student");
      } else if (data.role === "Instructor") {
        router.push("/faculty");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
        <img
          src="/images/campus.jpg"
          alt="Campus Building"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-slate-900/30"></div>
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <h2 className="text-4xl font-bold mb-4 drop-shadow-md">Smart LMS</h2>
          <p className="text-lg text-slate-200 drop-shadow-md">
            Join our learning management ecosystem today.
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Logo & Heading */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-slate-800 p-4 rounded-full shadow-lg mb-5">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-800">
              {portalName}
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">

            {/* Full Name */}
            <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
              <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                <User size={20} />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
              />
            </div>

            {/* Email */}
            <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
              <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
              />
            </div>

            {/* Enrollment ID (students only) */}
            {role === "student" && (
              <>
                <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
                  <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                    <Hash size={20} />
                  </div>
                  <input
                    type="text"
                    name="enrollmentId"
                    placeholder="Enrollment ID (e.g. STU-001)"
                    value={formData.enrollmentId}
                    onChange={handleChange}
                    className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
                  />
                </div>

                <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
                  <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                    <BookOpen size={20} />
                  </div>
                  <input
                    type="text"
                    name="class"
                    placeholder="Class (e.g. BSCS-4A)"
                    value={formData.class}
                    onChange={handleChange}
                    className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
                  />
                </div>

                <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
                  <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                    <BookOpen size={20} />
                  </div>
                  <input
                    type="text"
                    name="program"
                    placeholder="Program (e.g. BS Computer Science)"
                    value={formData.program}
                    onChange={handleChange}
                    className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
              <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                <Lock size={20} />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
              <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                <Lock size={20} />
              </div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-[#f5b842] hover:bg-[#e0a631] py-3 font-semibold text-slate-900 transition-colors shadow-sm disabled:opacity-60 mt-4"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

          </form>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm text-slate-600">
            <p>
              Already have an account?{" "}
              <Link
                href={`/login/${role}`}
                className="font-semibold text-amber-600 hover:text-amber-700 underline"
              >
                Log in here
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
