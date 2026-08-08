"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5000/api";

export default function PracticeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const lectureId = params.lectureId;

  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Attempt player state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null); // Results object after submitting

  // Fetch or generate practice quiz
  useEffect(() => {
    if (!lectureId) return;

    const loadQuiz = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        // First check if quiz is already available
        let res = await fetch(`${API_URL}/quizzes/lecture/${lectureId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setQuiz(data);
        } else {
          // If no quiz exists yet, generate it using Gemini
          setGenerating(true);
          const genRes = await fetch(`${API_URL}/quizzes/lecture/${lectureId}/generate`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });

          const genData = await genRes.json();
          if (!genRes.ok) {
            setError(genData.message || "Failed to generate quiz from lecture material.");
            toast.error(genData.message || "Failed to generate quiz from lecture material.");
            return;
          }

          setQuiz(genData.quiz);
          toast.success("AI Practice Quiz generated successfully!");
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError(err.message || "Could not load or generate quiz.");
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    };

    loadQuiz();
  }, [lectureId]);

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (results) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !quiz.questions) return;

    const total = quiz.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < total) {
      if (
        !window.confirm(
          `You have answered ${answeredCount} out of ${total} questions. Are you sure you want to submit?`
        )
      ) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const userAnswersPayload = Object.entries(selectedAnswers).map(
        ([qIdx, optIdx]) => ({
          questionIndex: Number(qIdx),
          selectedOptionIndex: optIdx,
        })
      );

      const res = await fetch(`${API_URL}/quizzes/${quiz._id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userAnswers: userAnswersPayload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit attempt");

      setResults(data);
      toast.success(`Quiz completed! You scored ${data.score}/${data.totalQuestions}`);
    } catch (err) {
      toast.error(err.message || "Failed to submit quiz attempt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setResults(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  // Loading Screen
  if (loading || generating) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-lg max-w-md w-full flex flex-col items-center space-y-5">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
              <BrainCircuit size={42} />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
              <Sparkles size={16} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">
            {generating ? "Analyzing Lecture with AI..." : "Loading Practice Quiz..."}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {generating
              ? "Gemini is reading the lecture materials to construct a custom practice quiz matching the content depth."
              : "Fetching your practice quiz items..."}
          </p>

          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Loader2 size={18} className="animate-spin" />
            <span>Please wait a moment...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm max-w-md w-full space-y-4">
          <XCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Could Not Load Quiz</h2>
          <p className="text-slate-500 text-sm">{error || "Practice quiz unavailable."}</p>
          <button
            onClick={() => router.back()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestionIndex];
  const totalQ = quiz.questions.length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition"
        >
          <ArrowLeft size={18} />
          Back to Course
        </button>

        {/* Practice Disclaimer Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl shadow-lg border border-slate-800 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Practice & Self-Assessment
                </span>
                <span className="bg-slate-800 text-slate-300 text-xs font-medium px-3 py-1 rounded-full border border-slate-700">
                  {totalQ} Questions
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {quiz.title}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Note: This practice quiz carries 0 sessional marks — purely for learning and self-testing.
              </p>
            </div>

            {results && (
              <button
                onClick={handleRetakeQuiz}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 shadow-md shrink-0"
              >
                <RotateCcw size={18} />
                Retake Quiz
              </button>
            )}
          </div>
        </div>

        {/* MAIN BODY: Quiz Attempts OR Results */}
        {!results ? (
          /* QUIZ PLAYER INTERFACE */
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 space-y-8">
            {/* Progress Bar & Counter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                <span>Question {currentQuestionIndex + 1} of {totalQ}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / totalQ) * 100)}% Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQ) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
                {currentQ.questionText}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((optionText, optIdx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                const optionLetters = ["A", "B", "C", "D"];

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                    className={`
                      w-full flex items-start gap-4 p-4 md:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer
                      ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-colors
                        ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }
                      `}
                    >
                      {optionLetters[optIdx]}
                    </div>
                    <span className={`text-base font-medium mt-1 ${isSelected ? "text-indigo-950 font-semibold" : "text-slate-700"}`}>
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={18} /> Previous
              </button>

              {currentQuestionIndex < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-7 py-2.5 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} />}
                  {submitting ? "Evaluating..." : "Submit Quiz"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* RESULTS & FEEDBACK BREAKDOWN INTERFACE */
          <div className="space-y-6">
            {/* Score Banner */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Award size={36} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800">
                You Scored {results.score} / {results.totalQuestions}
              </h2>
              <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-800 font-bold rounded-full text-lg">
                {results.percentage}%
              </div>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                {results.percentage >= 80
                  ? "Outstanding job! You've mastered key concepts in this lecture."
                  : results.percentage >= 50
                  ? "Good effort! Review the explanations below to strengthen your understanding."
                  : "Keep practicing! Take a look at the explanations for each topic below."}
              </p>
            </div>

            {/* Detailed Question Explanations */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle size={22} className="text-slate-600" />
                Detailed Explanations & Answers
              </h3>

              <div className="space-y-6">
                {results.evaluatedAnswers.map((item, qIdx) => {
                  const isCorrect = item.isCorrect;
                  const optionLetters = ["A", "B", "C", "D"];

                  return (
                    <div
                      key={qIdx}
                      className={`p-6 rounded-2xl border transition ${
                        isCorrect ? "bg-emerald-50/30 border-emerald-200" : "bg-red-50/30 border-red-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h4 className="font-bold text-slate-800 text-lg">
                          {qIdx + 1}. {item.questionText}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                            isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {item.options.map((opt, optIdx) => {
                          const isUserSelected = item.selectedOptionIndex === optIdx;
                          const isCorrectOption = item.correctOptionIndex === optIdx;

                          let style = "bg-white border-slate-200 text-slate-700";
                          if (isCorrectOption) {
                            style = "bg-emerald-100 border-emerald-300 text-emerald-950 font-semibold";
                          } else if (isUserSelected && !isCorrect) {
                            style = "bg-red-100 border-red-300 text-red-950 line-through opacity-80";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${style}`}
                            >
                              <span className="font-bold text-xs px-2 py-0.5 rounded bg-black/5">
                                {optionLetters[optIdx]}
                              </span>
                              <span>{opt}</span>
                              {isCorrectOption && (
                                <span className="ml-auto text-xs font-bold text-emerald-700 uppercase">
                                  Correct Answer
                                </span>
                              )}
                              {isUserSelected && !isCorrect && (
                                <span className="ml-auto text-xs font-bold text-red-700 uppercase">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* AI Explanation Box */}
                      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 text-xs md:text-sm text-slate-700">
                        <strong className="text-slate-900 block mb-1">💡 AI Explanation:</strong>
                        {item.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
