import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";

import StudentLayout from "./layouts/StudentLayout";
import FacultyLayout from "./layouts/FacultyLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";


// Student
import Dashboard from "./pages/student/Dashboard";
import MyCourses from "./pages/student/MyCourses";
import ViewCourse from "./pages/student/ViewCourse";
import Assignments from "./pages/student/Assignments";
import SubmitAssignment from "./pages/student/SubmitAssignment";
import Grades from "./pages/student/Grades";
import Quizzes from "./pages/student/Quizzes";
import Profile from "./pages/student/Profile";


// Faculty
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultyViewCourse from "./pages/faculty/ViewCourse";
import UploadLectureNotes from "./pages/faculty/UploadLectureNotes";
import CreateAssignment from "./pages/faculty/CreateAssignment";
import CreateQuiz from "./pages/faculty/CreateQuiz";
import Attendance from "./pages/faculty/Attendance";
import ViewSubmissions from "./pages/faculty/ViewSubmissions";
import FacultyCourses from "./pages/faculty/MyCourses";
import FacultyProfile from "./pages/faculty/FacultyProfile";
import FacultyAssignments from "./pages/faculty/FacultyAssignments";
import AutoGrading from "./pages/faculty/AutoGrading";
import Plagiarism from "./pages/faculty/Plagiarism";
import MidTermReports from "./pages/faculty/MidTermReports";
import Analytics from "./pages/faculty/Analytics";


// // Admin

import AdminDashboard from "./pages/admin/AdminDashboard";
import RegisterStudent from "./pages/admin/RegisterStudent";
import RegisterTeacher from "./pages/admin/RegisterTeacher";
import AssignCourse from "./pages/admin/AssignCourse";


function App() {

return (

<BrowserRouter>

<Routes>


{/* Landing */}

<Route 
path="/" 
element={<Landing />} 
/>

<Route path="/login/:role" element={<Login />} />
<Route path="/signup/:role" element={<Signup />} />



{/* ================= ADMIN =================


{/* ================= ADMIN ================= */}

<Route 
  path="/admin" 
  element={
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminLayout />
    </ProtectedRoute>
  }
>

  <Route 
    index 
    element={<AdminDashboard />} 
  />

  <Route 
    path="dashboard" 
    element={<AdminDashboard />} 
  />

  <Route 
    path="register-student" 
    element={<RegisterStudent />} 
  />

  <Route 
    path="register-teacher" 
    element={<RegisterTeacher />} 
  />

  <Route 
    path="assign-course" 
    element={<AssignCourse />} 
  />

</Route>






{/* ================= STUDENT ================= */}


<Route 
path="/student" 
element={
  <ProtectedRoute allowedRoles={["Student"]}>
    <StudentLayout />
  </ProtectedRoute>
}
>


<Route 
index 
element={<Dashboard />} 
/>


<Route 
path="dashboard" 
element={<Dashboard />} 
/>


<Route 
path="courses" 
element={<MyCourses />} 
/>


<Route 
path="course" 
element={<ViewCourse />} 
/>


<Route 
path="assignments" 
element={<Assignments />} 
/>


<Route 
path="submit-assignment" 
element={<SubmitAssignment />} 
/>


<Route 
path="grades" 
element={<Grades />} 
/>


<Route 
path="quizzes" 
element={<Quizzes />} 
/>


<Route 
path="profile" 
element={<Profile />} 
/>


</Route>








{/* ================= FACULTY ================= */}



<Route 
path="/faculty" 
element={
  <ProtectedRoute allowedRoles={["Instructor"]}>
    <FacultyLayout />
  </ProtectedRoute>
}
>


<Route 
index 
element={<FacultyDashboard />} 
/>


<Route 
path="dashboard" 
element={<FacultyDashboard />} 
/>


<Route 
path="courses" 
element={<FacultyCourses />} 
/>




<Route 
path="course/:id" 
element={<FacultyViewCourse />} 
/>




<Route 
path="course/:id/lectures" 
element={<UploadLectureNotes />} 
/>




<Route 
path="course/:id/assignments" 
element={<CreateAssignment />} 
/>




<Route 
path="course/:id/quizzes" 
element={<CreateQuiz />} 
/>




<Route 
path="course/:id/attendance" 
element={<Attendance />} 
/>




<Route 
path="course/:id/submissions" 
element={<ViewSubmissions />} 
/>




<Route 
path="profile" 
element={<FacultyProfile />} 
/>

<Route path="assignments" element={<FacultyAssignments />} />
<Route path="auto-grading" element={<AutoGrading />} />
<Route path="plagiarism" element={<Plagiarism />} />
<Route path="mid-term-reports" element={<MidTermReports />} />
<Route path="analytics" element={<Analytics />} />



</Route>





</Routes>


</BrowserRouter>


)

}


export default App;