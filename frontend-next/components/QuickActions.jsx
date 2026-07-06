"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function QuickActions() {

  const router = useRouter();
  const [actions, setActions] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let role = "Student";
    if (userStr) {
      const user = JSON.parse(userStr);
      role = user.role;
    }

    if (role === "Instructor" || role === "Admin") {
      setActions([
        { title: "View Courses", path: "/faculty/courses" },
        { title: "Dashboard", path: "/faculty/dashboard" },
        { title: "Analytics", path: "/faculty/analytics" },
      ]);
    } else {
      setActions([
        { title: "View Courses", path: "/student/courses" },
        { title: "View Assignments", path: "/student/assignments" },
        { title: "View Grades", path: "/student/grades" },
      ]);
    }
  }, []);


  return (

    <section className="mt-8">


      <h2 className="text-2xl font-bold text-slate-800 mb-5">
        Quick Actions
      </h2>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">


        {actions.map((action)=>(


          <button

            key={action.title}

            onClick={() => router.push(action.path)}

            className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            p-6
            text-left
            shadow-sm
            text-slate-700
            font-semibold
            hover:bg-slate-50
            hover:shadow-md
            transition
            duration-300
            "

          >

            {action.title}

          </button>


        ))}


      </div>


    </section>

  );
}
