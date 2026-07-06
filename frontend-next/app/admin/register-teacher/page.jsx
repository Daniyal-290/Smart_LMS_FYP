"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { UserPlus } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function RegisterTeacher() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/register-faculty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Faculty account created successfully!");
        setName("");
        setEmail("");
        setPassword("");
      } else {
        toast.error(data.message || "Registration failed.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="text-slate-700" size={28} />
        <h1 className="text-3xl font-bold text-slate-800">
          Register Teacher
        </h1>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
          <input type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="E.g., Dr. Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
          <input type="email" className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="teacher@smartlms.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password</label>
          <input type="password" className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-50">
          {loading ? "Creating..." : "Create Teacher Account"}
        </button>
      </form>
    </div>
  );
}
