import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import AreasPage from "@/pages/AreasPage";
import TimePage from "@/pages/TimePage";
import AdminPage from "@/pages/AdminPage";
import TidxSopningarPage from "@/pages/TidxSopningarPage";
import EgnaOmradenPage from "@/pages/EgnaOmradenPage";
import ChatPage from "@/pages/ChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            <Route path="/time" element={<TimePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/tidx" element={<TidxSopningarPage />} />
            <Route path="/egna" element={<EgnaOmradenPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
