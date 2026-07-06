import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  GraduationCap,
  User,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ name: "Student", role: "Student" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const items = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/student/dashboard",
    },
    {
      name: "My Courses",
      icon: <BookOpen size={20} />,
      path: "/student/courses",
    },
    {
      name: "Assignments",
      icon: <ClipboardList size={20} />,
      path: "/student/assignments",
    },
    {
      name: "Grades",
      icon: <GraduationCap size={20} />,
      path: "/student/grades",
    },
    {
      name: "Logout",
      icon: <LogOut size={20} />,
      path: "/",
    },
  ];

  const getInitials = (name) => {
    if (!name) return "S";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shadow-sm min-h-screen">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Smart LMS</h1>
        <p className="text-sm text-slate-400 mt-1">Student Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const active = location.pathname === item.path;

          return (
            <button
              key={item.name}
              onClick={async () => {
                if (item.name === "Logout") {
                  if (window.confirm("Are you sure you wanna log out?")) {
                    // Small delay for UI transition feel
                    await new Promise(resolve => setTimeout(resolve, 800));
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/");
                  }
                  return;
                }
                navigate(item.path);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                ${
                  active
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-800 p-4 mt-4">
        <button 
          onClick={() => navigate("/student/profile")}
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