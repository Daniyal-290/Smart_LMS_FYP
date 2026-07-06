import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    // Not logged in, redirect to home
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Role not allowed, redirect to home (or could redirect to unauthorized page)
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    // Error parsing user string (tampered localStorage?)
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }
}
