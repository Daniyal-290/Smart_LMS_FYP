import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Sparkles,
  ShieldAlert,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function FacultySidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ name: "Instructor", role: "Instructor" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const sections = [
    {
      heading: "Main",
      links: [
        { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/faculty/dashboard" },
        { title: "Courses", icon: <BookOpen size={20} />, path: "/faculty/courses" },
        { title: "Assignments", icon: <ClipboardList size={20} />, path: "/faculty/assignments" },
      ],
    },
    {
      heading: "AI Tools",
      links: [
        { title: "Auto Grading", icon: <Sparkles size={20} />, path: "/faculty/auto-grading" },
        { title: "Plagiarism", icon: <ShieldAlert size={20} />, path: "/faculty/plagiarism" },
        { title: "Analytics", icon: <BarChart3 size={20} />, path: "/faculty/analytics" },
      ],
    },
    {
      heading: "System",
      links: [
        { title: "Logout", icon: <LogOut size={20} />, path: "/" },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === "/") return false;
    if (path === "/faculty/dashboard") {
      return location.pathname === "/faculty" || location.pathname === "/faculty/dashboard";
    }
    return location.pathname === path;
  };

  const getInitials = (name) => {
    if (!name) return "F";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-5 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Smart LMS</h1>
        <p className="text-sm text-slate-400">Faculty Portal</p>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-6">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
              {section.heading}
            </p>
            <div className="space-y-1">
              {section.links.map((link) => {
                const active = isActive(link.path);
                return (
                  <button
                    key={link.title}
                    onClick={async () => {
                      if (link.title === "Logout") {
                        if (window.confirm("Are you sure you wanna log out?")) {
                          await new Promise(resolve => setTimeout(resolve, 800));
                          localStorage.removeItem("token");
                          localStorage.removeItem("user");
                          navigate("/");
                        }
                        return;
                      }
                      navigate(link.path);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition text-sm
                      ${active
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }
                    `}
                  >
                    {link.icon}
                    <span className="flex-1 text-left">{link.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-800 p-4 mt-4">
        <button 
          onClick={() => navigate("/faculty/profile")}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/50 transition text-left"
        >
          <div className="h-10 w-10 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-white text-sm truncate">{user.name}</p>
            <p className="text-xs text-slate-400">{user.role}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}