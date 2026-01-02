import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";

import Information from "./pages/Information";
import Index from "./pages/Index";
import StateDetail from "./pages/StateDetail";
import StateAgencyProfile from "./pages/StateAgencyProfile";
import FederalDetail from "./pages/FederalDetail";
import RegulationDetail from "./pages/RegulationDetail";
import SourceManagement from "./pages/SourceManagement";
import AlertPreferences from "./pages/AlertPreferences";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Workflows from "./pages/Workflows";
import NotificationPreferences from "./pages/NotificationPreferences";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Unsubscribe from "./pages/Unsubscribe";
import ComplianceChecklists from "./pages/ComplianceChecklists";
import TemplateLibrary from "./pages/TemplateLibrary";
import APIMonitoring from "./pages/APIMonitoring";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import StateComparison from "./pages/StateComparison";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import PasswordReset from "./pages/PasswordReset";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import DeploymentDashboard from "./pages/DeploymentDashboard";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import BetaInvites from "./pages/BetaInvites";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes - no authentication required */}
                <Route path="/" element={<Information />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/reset-password" element={<PasswordReset />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/app" element={<Index />} />
                <Route path="/federal" element={<FederalDetail />} />
                <Route path="/states/:stateSlug" element={<StateDetail />} />
                <Route path="/states/:stateSlug/agency" element={<StateAgencyProfile />} />
                <Route path="/regulations/:id" element={<RegulationDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/support" element={<Support />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/states/:state1/compare/:state2" element={<StateComparison />} />

                {/* Protected routes - require authentication */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><AlertPreferences /></ProtectedRoute>} />
                <Route path="/workflows" element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
                <Route path="/workflows/:id" element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
                <Route path="/notification-preferences" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/checklists" element={<ProtectedRoute><ComplianceChecklists /></ProtectedRoute>} />
                <Route path="/templates" element={<ProtectedRoute><TemplateLibrary /></ProtectedRoute>} />
                <Route path="/beta-invites" element={<ProtectedRoute><BetaInvites /></ProtectedRoute>} />

                {/* Admin routes - require admin role */}
                <Route path="/source-management" element={<ProtectedRoute adminOnly><SourceManagement /></ProtectedRoute>} />
                <Route path="/admin/sources" element={<ProtectedRoute adminOnly><SourceManagement /></ProtectedRoute>} />
                <Route path="/api-monitoring" element={<ProtectedRoute adminOnly><APIMonitoring /></ProtectedRoute>} />
                <Route path="/deployment" element={<ProtectedRoute adminOnly><DeploymentDashboard /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Cookie Consent Banner - shows for first-time visitors */}
              <CookieConsent />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
