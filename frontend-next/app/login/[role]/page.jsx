"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { GraduationCap, User, Lock } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function Login() {
  const router = useRouter();
  const params = useParams();
  const role = params.role;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const portalName = role
    ? `${role.charAt(0).toUpperCase()}${role.slice(1)} Portal`
    : "Smart LMS";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = role === "student" 
        ? { enrollmentId: email, password } 
        : { email, password };

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Check if trying to log into the wrong portal
      const expectedRole = role === "faculty" ? "Instructor" : role === "admin" ? "Admin" : "Student";
      if (role && data.role !== expectedRole) {
        setError(`Access Denied: Please log into the ${data.role} portal.`);
        setLoading(false);
        return;
      }

      // Store token and user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      }));

      // Add an artificial delay for smoother UI transition
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Navigate based on role from backend
      if (data.role === "Student") {
        router.push("/student");
      } else if (data.role === "Instructor") {
        router.push("/faculty");
      } else if (data.role === "Admin" || role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
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
            Empowering education through advanced learning management.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-sm">

          {/* Logo & Heading */}
          <div className="flex flex-col items-center mb-10">
            <div className="bg-slate-800 p-4 rounded-full shadow-lg mb-6">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-800">
              {portalName}
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-8">

            {/* Email or Enrollment ID */}
            {role === "student" ? (
              <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
                <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Enrollment ID (e.g., SP26-BCS-041)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
                />
              </div>
            ) : (
              <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
                <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                  <User size={20} />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
                />
              </div>
            )}

            {/* Password */}
            <div className="relative border-b-2 border-slate-300 focus-within:border-amber-500 transition-colors">
              <div className="absolute inset-y-0 left-0 flex items-center text-amber-500 pointer-events-none">
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent pl-8 py-2 outline-none text-slate-800 placeholder-slate-500"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between mt-2 mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="accent-amber-500 w-4 h-4" />
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-[#f5b842] hover:bg-[#e0a631] py-3 font-semibold text-slate-900 transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log in"}
            </button>

            <div className="text-center mt-6">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Lost password?
              </Link>
            </div>

          </form>

          {/* Signup Link removed - Students are registered by Admin */}

        </div>
      </div>

    </div>
  );
}
