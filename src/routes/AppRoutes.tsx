import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

// PAGES
import RoutePlanningPage from "../pages/RoutePlanningPage";
import PlanningPage from "../pages/PlanningPage";
import AdminPlanner from "../pages/AdminPlanner";
import LoginPage from "../pages/LoginPage";

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Vänta på auth (viktigt)
  if (loading) return <div>Loading...</div>;

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/planning" /> : <LoginPage />
        }
      />

      {/* ROOT */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/planning" /> : <Navigate to="/login" />
        }
      />

      {/* PROTECTED */}
      <Route
        path="/planning"
        element={
          <ProtectedRoute>
            <PlanningPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/route-planning"
        element={
          <ProtectedRoute>
            <RoutePlanningPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPlanner />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
};