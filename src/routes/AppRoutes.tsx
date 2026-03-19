import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

// IMPORTERA DINA NUVARANDE PAGES
import RoutePlanningPage from "../pages/RoutePlanningPage";
import PlanningPage from "../pages/PlanningPage";
import AdminPlanner from "../pages/AdminPlanner";
// lägg till fler här

export const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoutePlanningPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planning"
        element={
          <ProtectedRoute>
            <PlanningPage />
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