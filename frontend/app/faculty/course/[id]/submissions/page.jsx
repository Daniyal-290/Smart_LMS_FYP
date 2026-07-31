"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  Upload,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  MessageSquareText,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
const API_URL = "http://localhost:5000/api";

export default function ViewSubmissions() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState(id);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [navLoading, setNavLoading] = useState(false);

  const [regradingIds, setRegradingIds] = useState({});
  const [publishingIds, setPublishingIds] = useState({});
  const [publishingGroupIds, setPublishingGroupIds] = useState({});

  const [rubricModalAssignment, setRubricModalAssignment] = useState(null);
  const [rubricFile, setRubricFile] = useState(null);
  const [uploadingRubric, setUploadingRubric] = useState(false);

  const [feedbackSub, setFeedbackSub] = useState(null);

  const [jobs, setJobs] = useState({});
  const pollingRefs = useRef({});

  const fetchSubmissions = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/submissions/course/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Error fetching submissions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  const groups = useMemo(() => {
    const map = {};
    submissions.forEach((item) => {
      const aid = item.assignment?._id || "unknown";
      if (!map[aid]) {
        map[aid] = {
          assignmentId: aid,
          title: item.assignment?.title || "Unknown Assignment",
          totalPoints: item.assignment?.totalPoints || 100,
          items: [],
        };
      }
      map[aid].items.push(item);
    });
    return Object.values(map);
  }, [submissions]);

  const getReviewState = (item) => {
    if (item.aiGrade !== null && item.aiGrade !== undefined) return "published";
    if (item.pendingAiGrade !== null && item.pendingAiGrade !== undefined) return "pending";
    return "ungraded";
  };

  const openRubricModal = (assignmentId, title) => {
    setRubricFile(null);
    setRubricModalAssignment({ id: assignmentId, title });
  };

  const closeRubricModal = () => {
    setRubricModalAssignment(null);
    setRubricFile(null);
  };

  const startPolling = (assignmentId, jobId) => {
    if (pollingRefs.current[assignmentId]) {
      clearInterval(pollingRefs.current[assignmentId]);
    }

    const token = localStorage.getItem("token");

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/grading/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        setJobs((prev) => ({ ...prev, [assignmentId]: data }));

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(pollingRefs.current[assignmentId]);
          delete pollingRefs.current[assignmentId];

          if (data.status === "completed") {
            toast.success(
              `Grading complete: ${data.gradedCount} graded, ${data.failedCount} failed. Review and publish when ready.`
            );
          } else {
            toast.error(`Grading job failed: ${data.failureReason || "Unknown error"}`);
          }

          fetchSubmissions();
        }
      } catch (err) {
        console.error("Error polling job status", err);
      }
    };

    poll();
    pollingRefs.current[assignmentId] = setInterval(poll, 2500);
  };

  const submitAutograde = async () => {
    if (!rubricModalAssignment) return;
    if (!rubricFile) {
      toast.error("Please select a rubric file first.");
      return;
    }

    setUploadingRubric(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("rubricFile", rubricFile);

      const res = await fetch(
        `${API_URL}/grading/assignments/${rubricModalAssignment.id}/autograde`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to start grading job.");
        return;
      }

      toast.info(data.message || "Grading job started.");
      startPolling(rubricModalAssignment.id, data.jobId);
      closeRubricModal();
    } catch (err) {
      console.error("Error starting autograde job", err);
      toast.error("Something went wrong starting the grading job.");
    } finally {
      setUploadingRubric(false);
    }
  };

  const regradeSubmission = async (submissionId) => {
    setRegradingIds((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/grading/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to grade submission.");
        return;
      }

      toast.success("Graded — review the feedback, then publish when ready.");
      fetchSubmissions();
    } catch (err) {
      console.error("Error grading submission", err);
      toast.error("Something went wrong grading this submission.");
    } finally {
      setRegradingIds((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const publishSubmission = async (submissionId) => {
    setPublishingIds((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/grading/submissions/${submissionId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to publish grade.");
        return;
      }

      toast.success("Grade published to student.");
      fetchSubmissions();
    } catch (err) {
      console.error("Error publishing submission", err);
      toast.error("Something went wrong publishing this grade.");
    } finally {
      setPublishingIds((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const publishAllPending = async (assignmentId) => {
    setPublishingGroupIds((prev) => ({ ...prev, [assignmentId]: true }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/grading/assignments/${assignmentId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to publish grades.");
        return;
      }

      toast.success(data.message || "Published.");
      fetchSubmissions();
    } catch (err) {
      console.error("Error bulk publishing", err);
      toast.error("Something went wrong publishing these grades.");
    } finally {
      setPublishingGroupIds((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm p-8">

        <button
          onClick={() => {
            setNavLoading(true);
            router.push(`/faculty/course/${id}`);
          }}
          disabled={navLoading}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6 disabled:opacity-50"
        >
          {navLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          )}
          {navLoading ? "Loading..." : "Back to Course"}
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="bg-slate-800 text-white p-4 rounded-2xl">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">View Submissions</h1>
            <p className="text-slate-500">Review student assignments and quizzes</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <p className="text-slate-500">Total Submissions</p>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">{submissions.length}</h2>
          </div>
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <p className="text-slate-500">Ungraded</p>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">
              {submissions.filter((s) => getReviewState(s) === "ungraded").length}
            </h2>
          </div>
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <p className="text-slate-500">Pending Review</p>
            <h2 className="text-4xl font-bold text-amber-600 mt-2">
              {submissions.filter((s) => getReviewState(s) === "pending").length}
            </h2>
          </div>
          <div className="border rounded-2xl p-6 bg-white shadow-sm">
            <p className="text-slate-500">Published</p>
            <h2 className="text-4xl font-bold text-green-700 mt-2">
              {submissions.filter((s) => getReviewState(s) === "published").length}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading submissions...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No submissions found for this course.</div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => {
              const job = jobs[group.assignmentId];
              const isJobRunning = job && job.status !== "completed" && job.status !== "failed";
              const pendingCount = group.items.filter((s) => getReviewState(s) === "pending").length;

              return (
                <div key={group.assignmentId} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between bg-slate-100 px-6 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{group.title}</h3>
                      <p className="text-sm text-slate-500">
                        {group.items.length} submission{group.items.length !== 1 ? "s" : ""} ·{" "}
                        {pendingCount} awaiting publish · {group.totalPoints} pts
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {pendingCount > 0 && (
                        <button
                          onClick={() => publishAllPending(group.assignmentId)}
                          disabled={publishingGroupIds[group.assignmentId]}
                          title="Publish every reviewed-but-unpublished grade in this assignment"
                          className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl transition disabled:opacity-50 text-sm"
                        >
                          {publishingGroupIds[group.assignmentId] ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          Publish All Pending ({pendingCount})
                        </button>
                      )}

                      <button
                        onClick={() => openRubricModal(group.assignmentId, group.title)}
                        disabled={isJobRunning}
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                      >
                        {isJobRunning ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        {isJobRunning ? "Grading..." : "Autograde Assignment"}
                      </button>
                    </div>
                  </div>

                  {job && (
                    <div
                      className={`px-6 py-3 text-sm flex items-center gap-2 ${
                        job.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : job.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {job.status === "completed" ? (
                        <CheckCircle2 size={16} />
                      ) : job.status === "failed" ? (
                        <AlertCircle size={16} />
                      ) : (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      {job.status === "failed"
                        ? `Grading job failed: ${job.failureReason || "Unknown error"}`
                        : `${job.status === "completed" ? "Done" : "Grading"}: ${job.gradedCount}/${job.totalCount} graded${
                            job.failedCount ? `, ${job.failedCount} failed` : ""
                          }${job.status === "completed" ? " — awaiting your review below" : ""}`}
                    </div>
                  )}

                  <table className="w-full">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-6 py-3 text-left">Student</th>
                        <th className="px-6 py-3">Marks</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">File</th>
                        <th className="px-6 py-3">Feedback</th>
                        <th className="px-6 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => {
                        const state = getReviewState(item);
                        const displayGrade =
                          state === "published"
                            ? item.aiGrade
                            : state === "pending"
                            ? item.pendingAiGrade
                            : null;
                        const displayFeedback =
                          state === "published" ? item.aiFeedback : item.pendingAiFeedback;

                        return (
                          <tr key={item._id} className="border-b hover:bg-slate-50 transition">
                            <td className="px-6 py-5">
                              <p className="font-medium">{item.student?.name || "Unknown"}</p>
                              <p className="text-sm text-slate-500">{item.student?.enrollmentId || ""}</p>
                            </td>
                            <td className="text-center font-bold">
                              {displayGrade !== null ? (
                                <>
                                  {displayGrade}/{group.totalPoints}
                                  {state === "pending" && (
                                    <span className="block text-xs font-normal text-amber-600">(draft)</span>
                                  )}
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="text-center">
                              <span
                                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                  state === "published"
                                    ? "bg-green-100 text-green-700"
                                    : state === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {state === "published" ? "Published" : state === "pending" ? "Pending Review" : "Ungraded"}
                              </span>
                            </td>
                            <td className="text-center">
                              {item.fileUrl ? (
                                <a
                                  href={`http://localhost:5000${item.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View File
                                </a>
                              ) : (
                                <span className="text-slate-400">No File</span>
                              )}
                            </td>
                            <td className="text-center">
                              {displayFeedback ? (
                                <button
                                  onClick={() => setFeedbackSub({ ...item, _displayFeedback: displayFeedback, _displayGrade: displayGrade, _state: state })}
                                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <MessageSquareText size={14} />
                                  View
                                </button>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => regradeSubmission(item._id)}
                                  disabled={regradingIds[item._id]}
                                  title={state === "ungraded" ? "Grade this submission" : "Re-run grading for this submission"}
                                  className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl transition disabled:opacity-50 text-sm"
                                >
                                  {regradingIds[item._id] ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <RefreshCw size={14} />
                                  )}
                                  {regradingIds[item._id] ? "..." : state === "ungraded" ? "Grade" : "Regrade"}
                                </button>

                                {state === "pending" && (
                                  <button
                                    onClick={() => publishSubmission(item._id)}
                                    disabled={publishingIds[item._id]}
                                    title="Publish this grade to the student"
                                    className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-xl transition disabled:opacity-50 text-sm"
                                  >
                                    {publishingIds[item._id] ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Send size={14} />
                                    )}
                                    {publishingIds[item._id] ? "..." : "Publish"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rubricModalAssignment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Autograde Assignment</h3>
              <button onClick={closeRubricModal} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Upload a rubric file for <span className="font-semibold">{rubricModalAssignment.title}</span>.
              Gemini will parse it into grading criteria and grade every ungraded submission — as a
              draft only. Nothing is shown to students until you review and publish it.
            </p>

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-slate-400 transition">
              <Upload size={24} className="text-slate-400" />
              <span className="text-sm text-slate-600">
                {rubricFile ? rubricFile.name : "Click to select a rubric file (.docx, .pdf)"}
              </span>
              <input
                type="file"
                accept=".docx,.pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setRubricFile(e.target.files?.[0] || null)}
              />
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeRubricModal}
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitAutograde}
                disabled={uploadingRubric || !rubricFile}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {uploadingRubric ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {uploadingRubric ? "Starting..." : "Start Grading"}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800">
                {feedbackSub.student?.name || "Student"}'s Feedback
              </h3>
              <button onClick={() => setFeedbackSub(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  feedbackSub._state === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {feedbackSub._state === "published" ? "Published" : "Draft — not yet visible to student"}
              </span>
              <span className="text-sm text-slate-500">
                Score: <span className="font-semibold text-slate-800">{feedbackSub._displayGrade}</span>
              </span>
            </div>

            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {feedbackSub._displayFeedback}
            </p>

            {feedbackSub._state === "pending" && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    publishSubmission(feedbackSub._id);
                    setFeedbackSub(null);
                  }}
                  className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl transition"
                >
                  <Send size={16} />
                  Publish to Student
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
