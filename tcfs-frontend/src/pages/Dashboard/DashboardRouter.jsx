import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken, me } from "../../services/auth";

export default function DashboardRouter() {
  const token = getToken();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    me()
      .then((data) => {
        if (!active) return;
        const user = data?.user || data;
        const isAdmin = (user?.role || "user") === "admin";
        setRoute(<Navigate to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} replace />);
      })
      .catch(() => {
        if (!active) return;
        setRoute(<Navigate to="/login" replace />);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return route || null;
}
