"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.replace("/");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace("/");
        return;
      }

      setAuthorized(true);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/");
    } finally {
      setChecking(false);
    }
  }, [allowedRoles, router]);

  if (checking) {
    return null;
  }

  if (!authorized) {
    return null;
  }

  return children;
}
