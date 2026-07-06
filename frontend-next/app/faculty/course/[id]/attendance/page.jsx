"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarCheck, Search, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000/api";

export default function Attendance() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [lectureDate, setLectureDate] = useState("");
  const [lectureNo, setLectureNo] = useState("");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("On Campus");
  const [search, setSearch] = useState("");
  const [duration, setDuration] = useState("1");

  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCourse(data);
          const mappedStudents = data.students?.map((s) => ({
            id: s._id,
            roll: s.enrollmentId || "N/A",
            name: s.name,
            status: "Present"
          })) || [];
          setStudents(mappedStudents);
        } else {
          toast.error("Failed to load course details");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourse(false);
      }
    };
    fetchCourse();
  }, [id]);

  const updateStatus = (studentId, status) => {
    setStudents(students.map(student =>
      student.id === studentId ? { ...student, status } : student
    ));
  };

  const markAll = (status) => {
    setStudents(students.map(student => ({ ...student, status })));
  };

  const handleSave = async () => {
    if (!lectureDate || !lectureNo || !duration || !topic.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: id,
          lectureDate,
          lectureNo,
          duration,
          mode,
          topic,
          records: students.map(s => ({ student: s.id, status: s.status }))
        })
      });

      if (res.ok) {
        toast.success("Attendance saved successfully!");
        setTimeout(() => {
          router.push(`/faculty/course/${id}`);
        }, 1500);
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to save attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-10">
        
        {/* Back button */}
        <button
          onClick={() => router.push(`/faculty/course/${id}`)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6"
        >
          <ArrowLeft size={18} />
          Back to Course
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
              <CalendarCheck size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800">Mark Attendance</h1>
              <p className="text-slate-500 mt-1">Record lecture attendance and manage students</p>
            </div>
          </div>
          <div className="bg-green-50 px-5 py-3 rounded-xl border border-green-200">
            <p className="text-sm text-green-700 font-medium">Course Active</p>
          </div>
        </div>

        {/* Course Card */}
        <div className="bg-gradient-to-r from-slate-50 to-white border rounded-2xl p-7 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Course Information</h2>
          {loadingCourse ? (
            <p className="text-slate-500">Loading course info...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {[
                ["Course", course?.title || "Unknown"],
                ["Code", course?.courseCode || course?._id?.substring(course._id.length - 6).toUpperCase() || "N/A"],
                ["Faculty", course?.instructor?.name || "Unknown"]
              ].map((item) => (
                <div key={item[0]} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                  <p className="text-sm text-slate-500">{item[0]}</p>
                  <p className="font-bold text-lg text-slate-800 mt-1">{item[1]}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lecture Details */}
        <div className="bg-white border rounded-2xl p-7 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-6">Lecture Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              ["Lecture Date", lectureDate, setLectureDate, "date"],
              ["Lecture No", lectureNo, setLectureNo, "number"]
            ].map((item) => (
              <div key={item[0]}>
                <label className="font-semibold text-slate-700">{item[0]}</label>
                <input
                  type={item[3]}
                  value={item[1]}
                  onChange={(e) => item[2](e.target.value)}
                  className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-slate-800 outline-none transition"
                />
              </div>
            ))}
            <div>
              <label className="font-semibold">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2 w-full border rounded-xl px-4 py-3"
              >
                <option>1 Hour</option>
                <option>2 Hours</option>
                <option>3 Hours</option>
              </select>
            </div>
            <div>
              <label className="font-semibold">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mt-2 w-full border rounded-xl px-4 py-3"
              >
                <option>On Campus</option>
                <option>Online</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold">Topic Covered</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Database Normalization"
                className="mt-2 w-full border rounded-xl px-4 py-3"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          {[
            ["Present", "green"],
            ["Absent", "red"],
            ["Late", "yellow"],
            ["Total", "blue"]
          ].map((item) => (
            <div key={item[0]} className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition">
              <p className="text-slate-500">{item[0]}</p>
              <h2 className="text-4xl font-bold mt-2">
                {item[0] === "Total"
                  ? students.length
                  : students.filter(s => s.status === item[0]).length}
              </h2>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border rounded-xl py-3 pl-12 shadow-sm focus:ring-2 focus:ring-slate-700 outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mb-7">
          <button onClick={() => markAll("Present")} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition">✓ Mark All Present</button>
          <button onClick={() => markAll("Absent")} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition">✕ Mark All Absent</button>
          <button onClick={() => markAll("Late")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold transition">Late</button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-5 text-left">Roll</th>
                <th className="p-5 text-left">Student</th>
                <th className="p-5 text-center">Present</th>
                <th className="p-5 text-center">Late</th>
                <th className="p-5 text-center">Absent</th>
                <th className="p-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingCourse ? (
                <tr>
                  <td colSpan="6" className="p-5 text-center text-slate-500">Loading students...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-5 text-center text-slate-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="border-b hover:bg-slate-50 transition">
                    <td className="p-5 font-semibold">{student.roll}</td>
                    <td className="p-5">{student.name}</td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={student.status === "Present"}
                        onChange={() => updateStatus(student.id, "Present")}
                        className="w-5 h-5 accent-green-600"
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={student.status === "Late"}
                        onChange={() => updateStatus(student.id, "Late")}
                        className="w-5 h-5 accent-yellow-500"
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={student.status === "Absent"}
                        onChange={() => updateStatus(student.id, "Absent")}
                        className="w-5 h-5 accent-red-600"
                      />
                    </td>
                    <td className="text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                        student.status === "Present" ? "bg-green-100 text-green-700" :
                        student.status === "Absent" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition">Save Attendance</button>
        </div>

      </div>
    </div>
  );
}