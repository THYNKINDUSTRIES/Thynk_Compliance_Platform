import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionRoute } from "@/components/SubscriptionRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages — each becomes its own chunk
const Information = lazy(() => import("./pages/Information"));
const Index = lazy(() => import("./pages/Index"));
const StateDetail = lazy(() => import("./pages/StateDetail"));
const StateAgencyProfile = lazy(() => import("./pages/StateAgencyProfile"));
const FederalDetail = lazy(() => import("./pages/FederalDetail"));
const RegulationDetail = lazy(() => import("./pages/RegulationDetail"));
const SourceManagement = lazy(() => import("./pages/SourceManagement"));
const AlertPreferences = lazy(() => import("./pages/AlertPreferences"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Workflows = lazy(() => import("./pages/Workflows"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const ComplianceChecklists = lazy(() => import("./pages/ComplianceChecklists"));
const TemplateLibrary = lazy(() => import("./pages/TemplateLibrary"));
const APIMonitoring = lazy(() => import("./pages/APIMonitoring"));
const Contact = lazy(() => import("./pages/Contact"));
const Support = lazy(() => import("./pages/Support"));
const StateComparison = lazy(() => import("./pages/StateComparison"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const Profile = lazy(() => import("./pages/Profile"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const DeploymentDashboard = lazy(() => import("./pages/DeploymentDashboard"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const BetaInvites = lazy(() => import("./pages/BetaInvites"));
const LegislatureBills = lazy(() => import("./pages/LegislatureBills"));
const Forecasting = lazy(() => import("./pages/Forecasting"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE3]">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#794108] mx-auto" />
      <p className="mt-3 text-sm text-gray-500">Loading…</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* Skip navigation link for accessibility */}
              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-[#794108] focus:font-medium">
                Skip to main content
              </a>
              <div id="main-content">
              <Suspense fallback={<PageLoader />}>
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
                <Route path="/legislature-bills" element={<LegislatureBills />} />


                {/* Trial/Paid routes - require authentication and trial/paid access */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/dashboard" element={<SubscriptionRoute><Dashboard /></SubscriptionRoute>} />
                <Route path="/analytics" element={<SubscriptionRoute requirePaid><Analytics /></SubscriptionRoute>} />
                <Route path="/forecasting" element={<SubscriptionRoute requirePaid><Forecasting /></SubscriptionRoute>} />
                <Route path="/alerts" element={<SubscriptionRoute><AlertPreferences /></SubscriptionRoute>} />
                <Route path="/workflows" element={<SubscriptionRoute><Workflows /></SubscriptionRoute>} />
                <Route path="/workflows/:id" element={<SubscriptionRoute><Workflows /></SubscriptionRoute>} />
                <Route path="/notification-preferences" element={<SubscriptionRoute><NotificationPreferences /></SubscriptionRoute>} />
                <Route path="/settings" element={<SubscriptionRoute><Settings /></SubscriptionRoute>} />
                <Route path="/checklists" element={<SubscriptionRoute requirePaid><ComplianceChecklists /></SubscriptionRoute>} />
                <Route path="/templates" element={<SubscriptionRoute requirePaid><TemplateLibrary /></SubscriptionRoute>} />
                <Route path="/beta-invites" element={<SubscriptionRoute requirePaid><BetaInvites /></SubscriptionRoute>} />

                {/* Admin routes - require admin role */}
                <Route path="/source-management" element={<ProtectedRoute adminOnly><SourceManagement /></ProtectedRoute>} />
                <Route path="/admin/sources" element={<ProtectedRoute adminOnly><SourceManagement /></ProtectedRoute>} />
                <Route path="/api-monitoring" element={<ProtectedRoute adminOnly><APIMonitoring /></ProtectedRoute>} />
                <Route path="/deployment" element={<ProtectedRoute adminOnly><DeploymentDashboard /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </div>
              {/* Cookie Consent Banner - shows for first-time visitors */}
              <CookieConsent />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
