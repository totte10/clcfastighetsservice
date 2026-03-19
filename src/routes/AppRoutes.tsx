import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

// pages
import RoutePlanningPage from "../pages/RoutePlanningPage";
import PlanningPage from "../pages/PlanningPage";
import AdminPlanner from "../pages/AdminPlanner";
import LoginPage from "../pages/LoginPage";

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  // 🔥 VIKTIGAST AV ALLT
  if (loading) {
    return <div>Loading app...</div>;
  }

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/planning" replace /> : <LoginPage />
        }
      />

      {/* ROOT */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/planning" replace /> : <Navigate to="/login" replace />
        }
      />

      {/* PROTECTED */}
      <Route
        path="/planning"
        element={
          user ? <PlanningPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/route-planning"
        element={
          user ? <RoutePlanningPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/admin"
        element={
          user ? <AdminPlanner /> : <Navigate to="/login" replace />
        }
      />

    </Routes>
  );
};