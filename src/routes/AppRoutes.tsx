import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// pages
import RoutePlanningPage from "../pages/RoutePlanningPage";
import PlanningPage from "../pages/PlanningPage";
import AdminPlanner from "../pages/AdminPlanner";
import LoginPage from "../pages/LoginPage";
import AllEntriesPage from "../pages/AllEntriesPage"; // NY

export const AppRoutes = () => {
  const { user, loading, isAdmin } = useAuth();

  // 🔥 Vänta på auth (fixar alla buggar)
  if (loading) {
    return <div>Loading app...</div>;
  }

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/entries" replace /> : <LoginPage />
        }
      />

      {/* ROOT */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/entries" replace /> : <Navigate to="/login" replace />
        }
      />

      {/* 🔥 DASHBOARD (huvudsida) */}
      <Route
        path="/entries"
        element={
          user ? <AllEntriesPage /> : <Navigate to="/login" replace />
        }
      />

      {/* PLANNING */}
      <Route
        path="/planning"
        element={
          user ? <PlanningPage /> : <Navigate to="/login" replace />
        }
      />

      {/* ROUTE PLANNING */}
      <Route
        path="/route-planning"
        element={
          user ? <RoutePlanningPage /> : <Navigate to="/login" replace />
        }
      />

      {/* 🔐 ADMIN ONLY */}
      <Route
        path="/admin"
        element={
          user && isAdmin ? (
            <AdminPlanner />
          ) : (
            <Navigate to="/entries" replace />
          )
        }
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to={user ? "/entries" : "/login"} replace />}
      />

    </Routes>
  );
};