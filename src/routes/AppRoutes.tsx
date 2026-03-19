import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

// IMPORTERA DINA RIKTIGA PAGES
import RoutePlanningPage from "../pages/RoutePlanningPage";
import PlanningPage from "../pages/PlanningPage";
import AdminPlanner from "../pages/AdminPlanner";
import LoginPage from "../pages/LoginPage"; // viktigt!

export const AppRoutes = () => {
  return (
    <Routes>

      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* DEFAULT REDIRECT */}
      <Route path="/" element={<Navigate to="/planning" />} />

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