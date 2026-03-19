import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// pages
import Index from "../pages/Index"; // 🔥 DIN RIKTIGA DASHBOARD
import RoutePlanningPage from "../pages/RoutePlanningPage";
import PlanningPage from "../pages/PlanningPage";
import AdminPlanner from "../pages/AdminPlanner";
import LoginPage from "../pages/LoginPage";
import AllEntriesPage from "../pages/AllEntriesPage";

export const AppRoutes = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div>Loading app...</div>;
  }

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      {/* 🔥 ROOT = DIN SNYGGA INDEX DASHBOARD */}
      <Route
        path="/"
        element={
          user ? <Index /> : <Navigate to="/login" replace />
        }
      />

      {/* ALLA UPPDRAG */}
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

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          user && isAdmin
            ? <AdminPlanner />
            : <Navigate to="/" replace />
        }
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />

    </Routes>
  );
};