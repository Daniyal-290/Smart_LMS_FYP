"use client";

import { useState, useEffect } from "react";
import { BookOpen, UserCheck, CalendarDays, Hash, Loader2 } from "lucide-react";

const API_URL = "http://localhost:5000/api";

const COURSE_CATALOG = [
  { id: "CS-101", name: "Introduction to Computing" },
  { id: "CS-112", name: "Programming Fundamentals" },
  { id: "CS-211", name: "Object Oriented Programming" },
  { id: "CS-214", name: "Data Structures and Algorithms" },
  { id: "CS-301", name: "Database Systems" },
  { id: "CS-311", name: "Computer Architecture" },
  { id: "CS-411", name: "Artificial Intelligence" },
  { id: "CS-415", name: "Machine Learning" },
  { id: "IT-202", name: "Web Technologies" },
  { id: "IT-304", name: "Network Administration" },
  { id: "IT-315", name: "Cloud Computing" },
  { id: "SE-201", name: "Software Engineering" },
  { id: "SE-302", name: "Software Requirement Engineering" },
  { id: "SE-311", name: "Software Design and Architecture" },
  { id: "SE-405", name: "Software Testing" },
  { id: "CY-201", name: "Introduction to Cyber Security" },
  { id: "CY-305", name: "Network Security" },
  { id: "CY-401", name: "Ethical Hacking" },
  { id: "CY-408", name: "Digital Forensics" },
];

const SCHEDULE_OPTIONS = [
  "Mon/Wed 08:30 AM - 10:00 AM",
  "Mon/Wed 10:00 AM - 11:30 AM",
  "Mon/Wed 11:30 AM - 01:00 PM",
  "Mon/Wed 02:00 PM - 03:30 PM",
  "Tue/Thu 08:30 AM - 10:00 AM",
  "Tue/Thu 10:00 AM - 11:30 AM",
  "Tue/Thu 11:30 AM - 01:00 PM",
  "Tue/Thu 02:00 PM - 03:30 PM",
  "Friday 09:00 AM - 12:00 PM",
];

const CLASS_OPTIONS = [
  "BSCS-5A",
  "BSCS-5B",
  "BSCS-6A",
  "BSCS-6B",
  "BSSE-4A",
  "BSIT-3A",
  "MSCS-1A",
];

export default function AssignCourse() {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    teacher: "",
    schedule: "",
    classSection: "",
    term: "Spring 2026",
    credits: 3,
  });

  const [instructors, setInstructors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/auth/instructors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch instructors");
        const data = await res.json();
        setInstructors(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInstructors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const selectedCourse = COURSE_CATALOG.find(c => c.name === value);
      setFormData((prev) => ({ ...prev, name: value, id: selectedCourse ? selectedCourse.id : prev.id }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: formData.name,
          courseCode: formData.id,
          credits: formData.credits,
          description: `Schedule: ${formData.schedule} | Term: ${formData.term} | Class: ${formData.classSection}`,
          instructorId: formData.teacher
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to assign course");
      }

      setMessage(`Successfully assigned ${formData.name}!`);
      setFormData({ id: "", name: "", teacher: "", schedule: "", classSection: "", term: "Spring 2026", credits: 3 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-100 p-4 rounded-xl text-slate-700">
            <BookOpen size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Assign Course</h1>
            <p className="text-slate-500 mt-2">Assign a new course to a faculty member.</p>
          </div>
        </div>

        {message && (<div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium">{message}</div>)}
        {error && (<div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium">{error}</div>)}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><BookOpen size={16} /> Course Name</label>
              <select name="name" required value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition appearance-none">
                <option value="" disabled>Select Course...</option>
                {COURSE_CATALOG.map(course => (<option key={course.id} value={course.name}>{course.name}</option>))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Hash size={16} /> Course ID</label>
              <input type="text" name="id" required value={formData.id} onChange={handleChange} placeholder="e.g. CS-501" className="w-full bg-slate-100 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none text-slate-600 transition" readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><UserCheck size={16} /> Assign To Teacher</label>
            <select name="teacher" required value={formData.teacher} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition appearance-none">
              <option value="" disabled>Select an Instructor...</option>
              {instructors.map(inst => (<option key={inst._id} value={inst._id}>{inst.name} ({inst.email})</option>))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><BookOpen size={16} /> Class / Section</label>
              <select name="classSection" required value={formData.classSection} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition appearance-none">
                <option value="" disabled>Select Class...</option>
                {CLASS_OPTIONS.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><CalendarDays size={16} /> Schedule</label>
              <select name="schedule" required value={formData.schedule} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition appearance-none">
                <option value="" disabled>Select Schedule...</option>
                {SCHEDULE_OPTIONS.map(slot => (<option key={slot} value={slot}>{slot}</option>))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Assigning..." : "Assign Course"}
          </button>
        </form>

      </div>
    </div>
  );
}
