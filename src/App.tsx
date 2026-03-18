import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";

import RoutePlanningPage from "@/pages/RoutePlanningPage";
import Index from "@/pages/Index";
import AreasPage from "@/pages/AreasPage";
import TimePage from "@/pages/TimePage";
import AllTimeReportsPage from "@/pages/AllTimeReportsPage";

import AdminPage from "@/pages/AdminPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminPlanner from "@/pages/AdminPlanner";

import JobDetails from "@/pages/JobDetails";

import TidxSopningarPage from "@/pages/TidxSopningarPage";
import EgnaOmradenPage from "@/pages/EgnaOmradenPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";

import PlanningPage from "@/pages/PlanningPage";

import OptimalPage from "@/pages/OptimalPage";
import TmmPage from "@/pages/TmmPage";

import LoginPage from "@/pages/LoginPage";
import MissingCoordinatesPage from "@/pages/MissingCoordinatesPage";
import PayrollPage from "@/pages/PayrollPage";
import VoicePage from "@/pages/VoicePage";

import AIAssistantPage from "@/pages/AIAssistantPage";

import NotFound from "@/pages/NotFound";

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        {/* Dashboard = card grid home */}
        <Route path="/" element={<Index />} />

        {/* Route Planner */}
        <Route path="/route" element={<RoutePlanningPage />} />

        {/* Time */}
        <Route path="/time" element={<TimePage />} />
        <Route path="/time/reports" element={<AllTimeReportsPage />} />

        {/* Projects */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />

        {/* Planning */}
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/planner" element={<AdminPlanner />} />

        {/* Areas */}
        <Route path="/areas" element={<AreasPage />} />
        <Route path="/egna" element={<EgnaOmradenPage />} />
        <Route path="/tidx" element={<TidxSopningarPage />} />

        {/* Customers */}
        <Route path="/optimal" element={<OptimalPage />} />
        <Route path="/tmm" element={<TmmPage />} />

        {/* Voice */}
        <Route path="/voice" element={<VoicePage />} />

        {/* AI Assistant */}
        <Route path="/ai" element={<AIAssistantPage />} />

        {/* Reports */}
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/missing-coords" element={<MissingCoordinatesPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Job details */}
        <Route path="/job/:id" element={<JobDetails />} />


        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
