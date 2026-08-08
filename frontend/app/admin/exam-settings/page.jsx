"use client";

import { useState, useEffect } from "react";
import { Settings, Hash, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000/api";

export default function ExamSettings() {
  const [midtermTotalMarks, setMidtermTotalMarks] = useState("");
  const [finalsTotalMarks, setFinalsTotalMarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/exam-policy`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.midtermTotalMarks) {
            setMidtermTotalMarks(data.midtermTotalMarks);
            setFinalsTotalMarks(data.finalsTotalMarks);
          }
        }
      } catch (err) {
        console.error("Failed to load exam policy", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/exam-policy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          midtermTotalMarks: Number(midtermTotalMarks),
          finalsTotalMarks: Number(finalsTotalMarks),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update policy");

      toast.success("Exam policy updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update exam policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-100 p-4 rounded-xl text-slate-700">
            <Settings size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Exam Settings</h1>
            <p className="text-slate-500 mt-2">
              Configure university-wide exam mark totals for midterms and finals.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Hash size={16} /> Midterm Total Marks
              </label>
              <input
                type="number"
                min="1"
                required
                value={midtermTotalMarks}
                onChange={(e) => setMidtermTotalMarks(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Hash size={16} /> Finals Total Marks
              </label>
              <input
                type="number"
                min="1"
                required
                value={finalsTotalMarks}
                onChange={(e) => setFinalsTotalMarks(e.target.value)}
                placeholder="e.g. 50"
                className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> These values will be used by instructors when entering
              midterm and final exam marks. Changing them will apply to all future mark entries.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? "Saving..." : "Save Exam Policy"}
          </button>
        </form>
      </div>
    </div>
  );
}
