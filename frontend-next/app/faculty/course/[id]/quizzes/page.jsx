"use client";

import { useState } from "react";
import { FileQuestion } from "lucide-react";
import { toast } from "react-toastify";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);

  const handleCreate = () => {
    if (
      !title.trim() ||
      !instructions.trim() ||
      !totalMarks ||
      !timeLimit ||
      !deadline ||
      !file
    ) {
      toast.error("Please fill in all the fields and upload a quiz file.");
      return;
    }

    toast.success("Quiz created successfully!");

    setTitle("");
    setInstructions("");
    setTotalMarks("");
    setTimeLimit("");
    setDeadline("");
    setFile(null);

    // Clear file input
    document.getElementById("quiz-file").value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileQuestion className="text-slate-700" size={28} />
          <h1 className="text-3xl font-bold text-slate-800">
            Create Quiz
          </h1>
        </div>

        <div className="space-y-6">
          {/* Quiz Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quiz Title
            </label>

            <input
              type="text"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instructions
            </label>

            <textarea
              rows={5}
              placeholder="Enter quiz instructions..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Total Marks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total Marks
            </label>

            <input
              type="number"
              min="1"
              placeholder="Enter total marks"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time Limit (Minutes)
            </label>

            <input
              type="number"
              min="1"
              placeholder="Enter time limit"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quiz Deadline
            </label>

            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Quiz File */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload Quiz File
            </label>

            <input
              id="quiz-file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border border-slate-300 rounded-lg px-4 py-3"
            />

            <p className="text-sm text-slate-500 mt-2">
              Supported formats: PDF, DOC, DOCX, PPT, PPTX, ZIP
            </p>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition"
          >
            Create Quiz
          </button>
        </div>
      </div>
    </div>
  );
}