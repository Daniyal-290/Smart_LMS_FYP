import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Building2
} from "lucide-react";
import { useState, useEffect } from "react";

export default function FacultyProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const faculty = {
    name: user?.name || "Instructor Name",
    email: user?.email || "instructor@university.edu",
    role: user?.role || "Instructor",
    department: "Faculty of Computing",
    phone: "+92 300 1234567",
    designation: "Assistant Professor",
    experience: "8 Years Teaching Experience",
    courses: "Database Systems, AI, Networks"
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Profile Header */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
          <div className="flex items-center gap-5">
            <div className="bg-slate-800 text-white p-5 rounded-2xl">
              <User size={40}/>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {faculty.name}
              </h1>
              <p className="text-slate-500 mt-1">
                {faculty.designation} - {faculty.department}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Personal Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoCard icon={<User size={20}/>} title="Full Name" value={faculty.name} />
            <InfoCard icon={<Mail size={20}/>} title="Email" value={faculty.email} />
            <InfoCard icon={<Phone size={20}/>} title="Phone" value={faculty.phone} />
            <InfoCard icon={<Building2 size={20}/>} title="Department" value={faculty.department} />
          </div>
        </div>

        {/* Qualification */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <GraduationCap/>
            Qualifications
          </h2>
          <div className="space-y-4">
            <Qualification degree="PhD Computer Science" institute="FAST National University" year="2022" />
            <Qualification degree="MS Software Engineering" institute="NUST Islamabad" year="2017" />
            <Qualification degree="BS Computer Science" institute="University of Karachi" year="2014" />
          </div>
        </div>

        {/* University Position */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Briefcase/>
            University Position
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoCard icon={<Briefcase size={20}/>} title="Current Post" value={faculty.designation} />
            <InfoCard icon={<Building2 size={20}/>} title="Faculty" value={faculty.department} />
            <InfoCard icon={<GraduationCap size={20}/>} title="Experience" value={faculty.experience} />
            <InfoCard icon={<User size={20}/>} title="Courses Teaching" value={faculty.courses} />
          </div>
        </div>

      </div>
    </div>
  );
}









function InfoCard({icon,title,value}){


return (

<div className="
flex
items-center
gap-4
bg-slate-50
border
border-slate-200
rounded-xl
p-5
">


<div className="
bg-white
p-3
rounded-xl
text-slate-700
shadow-sm
">


{icon}


</div>




<div>


<p className="
text-sm
text-slate-500
">

{title}

</p>



<h3 className="
font-semibold
text-slate-800
">

{value}

</h3>


</div>



</div>

);


}










function Qualification({degree,institute,year}){


return (

<div className="
border
border-slate-200
rounded-xl
p-5
hover:bg-slate-50
transition
">


<h3 className="
font-semibold
text-slate-800
">

{degree}

</h3>


<p className="
text-slate-500
mt-1
">

{institute}

</p>


<p className="
text-sm
text-slate-400
mt-2
">

Completed: {year}

</p>



</div>


);


}