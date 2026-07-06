import {
  Users,
  GraduationCap,
  UserPlus,
  ArrowRight,
  BookOpen
} from "lucide-react";

import { useNavigate } from "react-router-dom";


export default function AdminDashboard() {


  const navigate = useNavigate();


  return (


    <div className="space-y-8">


      {/* Header */}

      <div
        className="
        bg-white
        border
        border-slate-200
        rounded-2xl
        shadow-sm
        p-8
        "
      >

        <div className="flex items-center gap-4">


          <div
            className="
            bg-slate-100
            p-4
            rounded-xl
            text-slate-700
            "
          >

            <Users size={30}/>

          </div>



          <div>

            <h1
              className="
              text-3xl
              font-bold
              text-slate-800
              "
            >

              Admin Dashboard

            </h1>


            <p className="text-slate-500 mt-2">

              Manage university students and faculty registrations.

            </p>


          </div>


        </div>


      </div>







      {/* Stats */}


      <div
        className="
        grid
        md:grid-cols-2
        gap-6
        "
      >



        <StatCard

          icon={<GraduationCap size={25}/>}

          title="Total Students"

          value="250"

        />



        <StatCard

          icon={<Users size={25}/>}

          title="Total Teachers"

          value="35"

        />


      </div>







      {/* Actions */}



      <div
        className="
        bg-white
        border
        border-slate-200
        rounded-2xl
        shadow-sm
        p-8
        "
      >


        <h2
          className="
          text-2xl
          font-bold
          text-slate-800
          mb-6
          "
        >

          Quick Actions

        </h2>




        <div className="grid md:grid-cols-2 gap-6">



          <button

            onClick={() =>
              navigate("/admin/register-student")
            }

            className="
            flex
            items-center
            justify-between
            bg-slate-800
            text-white
            p-5
            rounded-xl
            hover:bg-slate-700
            transition
            "

          >

            <div className="flex items-center gap-3">

              <UserPlus size={22}/>

              Register Student

            </div>


            <ArrowRight size={20}/>


          </button>






          <button
            onClick={() =>
              navigate("/admin/register-teacher")
            }
            className="
            flex
            items-center
            justify-between
            bg-slate-800
            text-white
            p-5
            rounded-xl
            hover:bg-slate-700
            transition
            "
          >
            <div className="flex items-center gap-3">
              <UserPlus size={22}/>
              Register Teacher
            </div>
            <ArrowRight size={20}/>
          </button>

          <button
            onClick={() => navigate("/admin/assign-course")}
            className="
            flex
            items-center
            justify-between
            bg-slate-800
            text-white
            p-5
            rounded-xl
            hover:bg-slate-700
            transition
            "
          >
            <div className="flex items-center gap-3">
              <BookOpen size={22}/>
              Assign Course
            </div>
            <ArrowRight size={20}/>
          </button>

        </div>



      </div>



    </div>


  );

}







function StatCard({icon,title,value}){


return(

<div
className="
bg-white
border
border-slate-200
rounded-2xl
shadow-sm
p-6
"
>


<div className="flex items-center gap-4">


<div
className="
bg-slate-100
p-3
rounded-xl
text-slate-700
"
>

{icon}

</div>



<div>

<p className="text-slate-500 text-sm">

{title}

</p>


<h2 className="text-3xl font-bold text-slate-800">

{value}

</h2>


</div>


</div>


</div>

)


}