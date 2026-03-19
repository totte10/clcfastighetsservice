import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

// IMPORTERA DINA PAGES (justera namn om de skiljer sig)
import PlanningPage from "../pages/PlanningPage";
import RoutePlanningPage from "../pages/RoutePlanningPage";
import AdminPlanner from "../pages/AdminPlanner";

// om du har login page:
import LoginPage from "../pages/LoginPage";

export const AppRoutes = () => {
  return (
    <Routes>

      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* STARTSIDA → redirect */}
      <Route path="/" element={<Navigate to="/planning" />} />

      {/* PROTECTED ROUTES */}
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