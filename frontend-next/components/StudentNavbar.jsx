"use client";

import {
Search,
Bell
}
from "lucide-react";


export default function StudentNavbar(){


return(

<header className="
bg-white
shadow-sm
px-8
py-5
flex
justify-between
items-center
">


<h1 className="
text-3xl
font-bold
text-slate-800
">

Student Dashboard

</h1>



<div className="flex items-center gap-4">


<div className="relative">


<Search
className="
absolute
left-3
top-3
text-slate-400
"
size={18}
/>


<input

placeholder="Search..."

className="
pl-10
pr-4
py-2
rounded-xl
border
border-slate-300
"
/>


</div>


<Bell/>

<img
src="https://i.pravatar.cc/100"
className="
w-10
h-10
rounded-full
"
/>


<div>

<p className="font-semibold">
Bakhtawar Abro
</p>


<p className="text-sm text-slate-500">
Student
</p>


</div>


</div>



</header>

)

}
