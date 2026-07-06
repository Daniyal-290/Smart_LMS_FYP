import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

export default function Grades() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/submissions/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch grades");
        }
        
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGrades();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Loading grades...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Academic Results
        </h1>
        <p className="mt-2 text-slate-600">
          View your assignment grades and academic performance.
        </p>
      </div>

      {/* Current Semester */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Recent Assignments
          </h2>
        </div>

        {submissions.length === 0 ? (
          <div className="text-slate-500 py-4 text-center">
            No graded assignments found.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 text-slate-600">Course</th>
                <th className="text-slate-600">Assignment</th>
                <th className="text-slate-600">Total Points</th>
                <th className="text-slate-600">Your Score</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr
                  key={sub._id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="py-4 font-medium text-slate-800">
                    {sub.assignment?.course?.title || "Unknown Course"}
                  </td>
                  <td className="text-slate-600">{sub.assignment?.title || "Unknown"}</td>
                  <td className="text-slate-600">{sub.assignment?.totalPoints || 100}</td>
                  <td className="font-semibold text-slate-800">
                    {sub.aiGrade || "Not Graded Yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}