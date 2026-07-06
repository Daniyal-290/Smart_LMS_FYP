import {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  LogOut,
  BookOpen
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

export default function AdminSidebar(){
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    {
      title:"Dashboard",
      icon:<LayoutDashboard size={20}/>,
      path:"/admin/dashboard"
    },
    {
      title:"Register Student",
      icon:<UserPlus size={20}/>,
      path:"/admin/register-student"
    },
    {
      title:"Register Teacher",
      icon:<GraduationCap size={20}/>,
      path:"/admin/register-teacher"
    },
    {
      title:"Assign Course",
      icon:<BookOpen size={20}/>,
      path:"/admin/assign-course"
    },
  ];

  return (
    <aside
      className="
        w-64
        min-h-screen
        bg-slate-900
        border-r
        border-slate-800
        p-5
        flex
        flex-col
      "
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Smart LMS
        </h1>
        <p className="text-sm text-slate-400">
          Admin Portal
        </p>
      </div>

      <div className="space-y-3 flex-1">
        {links.map(link=>{
          const active = location.pathname===link.path;
          return (
            <button
              key={link.title}
              onClick={()=>navigate(link.path)}
              className={`
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                font-medium
                transition-colors
                ${
                  active
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }
              `}
            >
              {link.icon}
              {link.title}
            </button>
          )
        })}
      </div>

      <button
        onClick={async () => {
          if (window.confirm("Are you sure you wanna log out?")) {
            await new Promise(resolve => setTimeout(resolve, 800));
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
          }
        }}
        className="
          mt-8
          w-full
          flex
          items-center
          gap-3
          px-4
          py-3
          rounded-xl
          hover:bg-slate-800/50
          text-slate-400
          hover:text-slate-200
          font-medium
          transition-colors
        "
      >
        <LogOut size={20}/>
        Logout
      </button>

      {/* User Profile */}
      <div className="border-t border-slate-800 pt-5 mt-4">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
            AD
          </div>
          <div>
            <p className="font-semibold text-white text-sm">System Admin</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </div>

    </aside>
  )
}