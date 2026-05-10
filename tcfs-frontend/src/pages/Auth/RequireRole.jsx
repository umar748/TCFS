import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../../services/auth";

export default function RequireRole({ role, children }) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const current = user.role || "user";
  if (role === "admin" && current !== "admin") {
    return <Navigate to="/dashboard/user" replace />;
  } else if (role === "user" && current !== "user") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return children;
}
