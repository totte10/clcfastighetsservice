import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import AreasPage from "@/pages/AreasPage";
import TimePage from "@/pages/TimePage";
import AllTimeReportsPage from "@/pages/AllTimeReportsPage";
import AdminPage from "@/pages/AdminPage";
import TidxSopningarPage from "@/pages/TidxSopningarPage";
import EgnaOmradenPage from "@/pages/EgnaOmradenPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ChatPage from "@/pages/ChatPage";
import PlanningPage from "@/pages/PlanningPage";
import OptimalPage from "@/pages/OptimalPage";
import TmmPage from "@/pages/TmmPage";
import LoginPage from "@/pages/LoginPage";
import MissingCoordinatesPage from "@/pages/MissingCoordinatesPage";
import PayrollPage from "@/pages/PayrollPage";
import RoutePlanningPage from "@/pages/RoutePlanningPage";
import VoicePage from "@/pages/VoicePage";
import AdminPanelPage from "@/pages/AdminPanelPage";
import NotFound from "./pages/NotFound";
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
        <Route path="/" element={<Dashboard />} />
        <Route path="/time" element={<TimePage />} />
        <Route path="/time/reports" element={<AllTimeReportsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/tidx" element={<TidxSopningarPage />} />
        <Route path="/egna" element={<EgnaOmradenPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/optimal" element={<OptimalPage />} />
        <Route path="/tmm" element={<TmmPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/missing-coords" element={<MissingCoordinatesPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/route" element={<RoutePlanningPage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/admin-panel" element={<AdminPanelPage />} />
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
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
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

export default App;
