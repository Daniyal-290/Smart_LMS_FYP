import { Mail, Phone, GraduationCap, BookOpen, User } from "lucide-react";
import studentImage from "../../assets/images/student.jpg";
import { useState, useEffect } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const student = {
    name: user?.name || "Student Name",
    id: user?.enrollmentId || "Pending",
    program: user?.program || "Undergraduate",
    department: "Computer Science",
    semester: user?.class || "N/A",
    batch: "2023 - 2027",
    email: user?.email || "student@university.edu",
    phone: "+92 300 1234567",
    cgpa: "N/A",
    credits: "0 / 130",
    advisor: "Dr. Ali Khan",
    enrollment: "Fall 2023",
    status: "Active Student",
    campus: "Main Campus",
    section: "BSCS - A"
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Student Profile</h1>
        <p className="text-gray-500 mt-2">Personal and academic information</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-200 bg-slate-100 flex items-center justify-center">
            {/* Fallback avatar if no image */}
            <User size={64} className="text-slate-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
            <p className="text-gray-500 mt-1">{student.id}</p>
            <div className="flex gap-2 mt-3">
              <span className="px-4 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {student.program}
              </span>
              <span className="px-4 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {student.semester}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Academic Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Info icon={<GraduationCap/>} title="Degree Program" value={student.program} />
          <Info icon={<BookOpen/>} title="Department" value={student.department} />
          <Info icon={<BookOpen/>} title="Batch" value={student.batch} />
          <Info icon={<GraduationCap/>} title="Semester / Class" value={student.semester} />
          <Info icon={<BookOpen/>} title="Enrollment" value={student.enrollment} />
          <Info icon={<GraduationCap/>} title="Academic Advisor" value={student.advisor} />
          <Info icon={<BookOpen/>} title="Current CGPA" value={student.cgpa} />
          <Info icon={<BookOpen/>} title="Completed Credits" value={student.credits} />
          <Info icon={<User/>} title="Academic Status" value={student.status} />
          <Info icon={<BookOpen/>} title="Campus" value={student.campus} />
        </div>
      </section>

      {/* Contact */}
      <section className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-5">Contact Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Info icon={<Mail/>} title="University Email" value={student.email} />
          <Info icon={<Phone/>} title="Phone" value={student.phone} />
        </div>
      </section>
    </div>
  );
}





function Info({icon,title,value}){


return (

<div className="flex items-center gap-4">


<div className="text-gray-500">
{icon}
</div>


<div>

<p className="text-sm text-gray-400">
{title}
</p>


<p className="text-gray-700 font-medium">
{value}
</p>


</div>


</div>

)


}