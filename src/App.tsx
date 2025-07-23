
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import PatientRegistration from "./components/PatientRegistration";
import DoctorDashboard from "./components/DoctorDashboard";
import DoctorManagement from "./components/DoctorManagement";
import AnnouncementScreen from "./components/AnnouncementScreen";
import NotFound from "./pages/NotFound";
import DoctorLogin from "./components/DoctorLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/index" element={<Index />} />
          <Route path="/login" element={<DoctorLogin onLoginSuccess={() => window.location.replace('/doctor')} />} />
          <Route path="/patient" element={<PatientRegistration />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor-management" element={<DoctorManagement />} />
          <Route path="/display" element={<AnnouncementScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
