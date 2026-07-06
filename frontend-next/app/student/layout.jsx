"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";

export default function StudentLayout({ children }) {

  return (
    <ProtectedRoute allowedRoles={["Student"]}>
      <div className="flex min-h-screen bg-gray-100">

        {/* Existing Dashboard Bar */}
        <Sidebar />


        {/* Page Content */}
        <main className="flex-1 p-6">

          {children}

        </main>


      </div>
    </ProtectedRoute>
  );

}
