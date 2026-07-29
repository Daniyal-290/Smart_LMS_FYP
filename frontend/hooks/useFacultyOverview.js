"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = "http://localhost:5000/api";

// ===================================================
// useFacultyOverview
// ===================================================
// Single source of truth for the faculty portal's "real data" pages
// (dashboard, assignments, auto-grading, analytics).
//
// Review-state semantics (matches the backend's draft/publish design):
//   - ungraded:      neither aiGrade nor pendingAiGrade set
//   - pendingReview: pendingAiGrade set, aiGrade still null (draft, teacher hasn't published)
//   - published:     aiGrade set (visible to the student)

export function useFacultyOverview() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]); // enriched, flat, across all courses
  const [submissions, setSubmissions] = useState([]); // flat, across all courses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const coursesRes = await fetch(`${API_URL}/courses`, { headers });
      if (!coursesRes.ok) throw new Error("Failed to fetch courses");
      const coursesData = await coursesRes.json();

      const perCourse = await Promise.all(
        coursesData.map(async (course) => {
          const [assignRes, subRes] = await Promise.all([
            fetch(`${API_URL}/assignments/course/${course._id}`, { headers }),
            fetch(`${API_URL}/submissions/course/${course._id}`, { headers }),
          ]);
          const courseAssignments = assignRes.ok ? await assignRes.json() : [];
          const courseSubmissions = subRes.ok ? await subRes.json() : [];
          return { course, courseAssignments, courseSubmissions };
        })
      );

      const allSubmissions = [];
      const allAssignments = [];

      perCourse.forEach(({ course, courseAssignments, courseSubmissions }) => {
        allSubmissions.push(...courseSubmissions);

        courseAssignments.forEach((a) => {
          const subsForThisAssignment = courseSubmissions.filter(
            (s) => s.assignment?._id === a._id
          );

          const publishedSubs = subsForThisAssignment.filter(
            (s) => s.aiGrade !== null && s.aiGrade !== undefined
          );
          const pendingSubs = subsForThisAssignment.filter(
            (s) =>
              (s.aiGrade === null || s.aiGrade === undefined) &&
              s.pendingAiGrade !== null &&
              s.pendingAiGrade !== undefined
          );

          const totalStudents = course.students?.length || 0;
          const submittedCount = subsForThisAssignment.length;
          const publishedCount = publishedSubs.length;
          const pendingReviewCount = pendingSubs.length;

          const avgPublishedScore =
            publishedCount > 0
              ? publishedSubs.reduce((sum, s) => sum + s.aiGrade, 0) / publishedCount
              : null;

          const isPastDue = new Date(a.dueDate) < new Date();
          let status;
          if (isPastDue && submittedCount < totalStudents) {
            status = "Overdue";
          } else if (pendingReviewCount > 0) {
            status = "Pending Review";
          } else if (submittedCount > 0 && publishedCount === submittedCount) {
            status = "Graded";
          } else if (submittedCount === 0) {
            status = "No Submissions";
          } else {
            status = "Pending";
          }

          allAssignments.push({
            ...a,
            courseTitle: course.title,
            courseId: course._id,
            totalStudents,
            submittedCount,
            publishedCount,
            pendingReviewCount,
            ungradedCount: submittedCount - publishedCount - pendingReviewCount,
            avgPublishedScore,
            progress: totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0,
            status,
          });
        });
      });

      setCourses(coursesData);
      setAssignments(allAssignments);
      setSubmissions(allSubmissions);
    } catch (err) {
      console.error("useFacultyOverview error:", err);
      setError(err.message || "Failed to load faculty data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { courses, assignments, submissions, loading, error, refetch: fetchAll };
}
