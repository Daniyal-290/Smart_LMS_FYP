
import { Outlet, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import FacultySidebar from "../components/FacultySidebar";


export default function FacultyLayout() {


  const navigate = useNavigate();


  return (

    <div
      className="
        flex
        min-h-screen
        bg-slate-50
      "
    >


      {/* Faculty Dashboard Sidebar */}

      <FacultySidebar />



      {/* Main Area */}

      <div className="flex-1 flex flex-col">


        {/* Header */}

        <header
          className="
            bg-white
            border-b
            border-slate-200
            px-8
            py-4
            flex
            items-center
            justify-between
            shrink-0
          "
        >

          <h2 className="text-xl font-semibold text-slate-800">
            Overview — Spring 2026
          </h2>


          <div className="flex items-center gap-6">






            {/* New Assignment Button (Gold) */}

            <button
              onClick={() => navigate("/faculty/course/1/assignments")}
              className="
                bg-amber-500
                hover:bg-amber-600
                text-white
                font-semibold
                px-5
                py-2.5
                rounded-xl
                transition
                flex
                items-center
                gap-2
                shadow-sm
                cursor-pointer
              "
            >
              <Plus size={18} />
              New Assignment
            </button>


          </div>

        </header>



        {/* Page Content */}

        <main className="flex-1 p-8 overflow-y-auto">

          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>

        </main>


      </div>


    </div>

  );

}