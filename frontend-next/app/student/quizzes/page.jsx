"use client";

import { useState } from "react";
import { toast } from "react-toastify";

export default function Quizzes() {

  const questions = [
    {
      id: 1,
      question: "Which data structure follows LIFO?",
      options: ["Queue", "Linked List", "Stack", "Tree"],
      answer: "Stack",
    },
    {
      id: 2,
      question: "Root → Left → Right is?",
      options: ["Inorder", "Preorder", "Postorder", "Level Order"],
      answer: "Preorder",
    },
    {
      id: 3,
      question: "BFS uses?",
      options: ["Stack", "Queue", "Heap", "Tree"],
      answer: "Queue",
    },
    {
      id: 4,
      question: "Binary Search complexity?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      answer: "O(log n)",
    },
    {
      id: 5,
      question: "Linear data structure?",
      options: ["Graph", "Tree", "Linked List", "Heap"],
      answer: "Linked List",
    },
  ];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (id, option) => {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [id]: option,
    }));
  };

  const handleSubmit = () => {

    const answeredCount = Object.keys(answers).length;

    if (answeredCount !== questions.length) {
      toast.warning("Please answer all questions first!", {
        autoClose: 3000,
      });
      return;
    }

    let score = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.answer) {
        score++;
      }
    });

    const percentage = Math.round((score / questions.length) * 100);

    setSubmitted(true);

    toast.success(
      `🎉 You scored ${score}/${questions.length} (${percentage}%)`,
      {
        autoClose: 5000,
        closeButton: true,
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-6">

      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

        {/* Header */}
        <div className="mb-8">
          <span className="px-3 py-1 bg-slate-200 rounded-full text-sm text-slate-700">
            AI Generated Quiz
          </span>

          <h1 className="text-3xl font-bold text-slate-800 mt-4">
            Data Structures & Algorithms
          </h1>

          <p className="text-slate-600 mt-2">
            5 Questions • Auto Checked Quiz
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">

          {questions.map((q) => (

            <div
              key={q.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-6"
            >

              <h2 className="font-semibold text-slate-800 mb-4">
                Q{q.id}. {q.question}
              </h2>

              <div className="space-y-3">

                {q.options.map((option) => {

                  const isSelected = answers[q.id] === option;
                  const isCorrect = option === q.answer;
                  const isWrongSelected =
                    submitted && isSelected && !isCorrect;

                  return (
                    <label
                      key={option}
                      className={`
                        flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition

                        ${isSelected ? "bg-slate-200 border-slate-500" : "bg-white border-slate-200"}

                        ${submitted && isCorrect ? "border-green-500 bg-green-50" : ""}

                        ${isWrongSelected ? "border-red-500 bg-red-50" : ""}
                      `}
                    >

                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={isSelected}
                        onChange={() => handleSelect(q.id, option)}
                      />

                      <span className="text-slate-700">
                        {option}
                      </span>

                      {submitted && isCorrect && (
                        <span className="ml-auto text-green-600 font-semibold">
                          ✓ Correct
                        </span>
                      )}

                      {isWrongSelected && (
                        <span className="ml-auto text-red-600 font-semibold">
                          ✗ Wrong
                        </span>
                      )}

                    </label>
                  );
                })}

              </div>

            </div>

          ))}

        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="mt-10 w-full py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800 transition"
        >
          Submit Quiz
        </button>

      </div>

    </div>
  );
}