"use client";

import AdminSidebar from "@/components/AdminSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";


export default function AdminLayout({ children }){

return (
  <ProtectedRoute allowedRoles={["Admin"]}>
    <div className="flex">

      <AdminSidebar/>


      <main className="flex-1 p-8">

        {children}

      </main>


    </div>
  </ProtectedRoute>
)


}
