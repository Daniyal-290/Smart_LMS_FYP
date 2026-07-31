"use client";

import { useState, useEffect } from "react";
import { MessageSquareText, X } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function Grades() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [feedbackSub, setFeedbackSub] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/submissions/me`, {
          headers: { Authorization: `Bearer ${token}` },
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Academic Results</h1>
        <p className="mt-2 text-slate-600">View your assignment grades and academic performance.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Recent Assignments</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="text-slate-500 py-4 text-center">No graded assignments found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 text-slate-600">Course</th>
                <th className="text-slate-600">Assignment</th>
                <th className="text-slate-600">Total Points</th>
                <th className="text-slate-600">Your Score</th>
                <th className="text-slate-600">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                // Checking `=== null` here, not a falsy check — a
                // legitimate score of 0 should still display as 0, not
                // be mistaken for "not graded yet".
                const isGraded = sub.aiGrade !== null && sub.aiGrade !== undefined;

                return (
                  <tr key={sub._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-4 font-medium text-slate-800">
                      {sub.assignment?.course?.title || "Unknown Course"}
                    </td>
                    <td className="text-slate-600">{sub.assignment?.title || "Unknown"}</td>
                    <td className="text-slate-600">{sub.assignment?.totalPoints || 100}</td>
                    <td className="font-semibold text-slate-800">
                      {isGraded ? `${sub.aiGrade}/${sub.assignment?.totalPoints || 100}` : "Not Graded Yet"}
                    </td>
                    <td>
                      {isGraded && sub.aiFeedback ? (
                        <button
                          onClick={() => setFeedbackSub(sub)}
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <MessageSquareText size={15} />
                          View Feedback
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {feedbackSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800">
                {feedbackSub.assignment?.title || "Assignment"} Feedback
              </h3>
              <button onClick={() => setFeedbackSub(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Score:{" "}
              <span className="font-semibold text-slate-800">
                {feedbackSub.aiGrade}/{feedbackSub.assignment?.totalPoints || 100}
              </span>
            </p>

            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {feedbackSub.aiFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
