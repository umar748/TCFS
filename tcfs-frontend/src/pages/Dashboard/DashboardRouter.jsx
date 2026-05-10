import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken, me } from "../../services/auth";

export default function DashboardRouter() {
  const token = getToken();
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (!token) return;
    me()
      .then((data) => {
        const user = data?.user || data; // Handle both direct user object or { user: ... }
        const isAdmin = (user?.role || "user") === "admin";
        setRoute(<Navigate to={isAdmin ? "/dashboard/admin" : "/explore-destinations"} replace />);
      })
      .catch(() => {
        setRoute(<Navigate to="/login" replace />);
      });
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return route || null;
}
