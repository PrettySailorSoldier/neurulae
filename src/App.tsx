import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PremiumProvider, usePremium } from "@/contexts/PremiumContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PublicOnly } from "@/components/auth/PublicOnly";
import { lazy, Suspense } from "react";

// Eagerly load landing and auth (critical path)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

// Lazy load all other pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Settings = lazy(() => import("./pages/Settings"));
const Success = lazy(() => import("./pages/Success"));
const MyAvailability = lazy(() => import("./pages/MyAvailability"));
const MyPlan = lazy(() => import("./pages/MyPlan"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Protected route that requires admin access
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = usePremium();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

// Page loader for Suspense fallback during lazy loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PremiumProvider>
        <TimerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
                  <Route path="/app" element={<RequireAuth><Index /></RequireAuth>} />
                  <Route path="/tasks" element={<RequireAuth><Tasks /></RequireAuth>} />
                  <Route path="/auth" element={<PublicOnly><Auth /></PublicOnly>} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/my-schedule" element={<RequireAuth><MyAvailability /></RequireAuth>} />
                  <Route path="/my-plan" element={<RequireAuth><MyPlan /></RequireAuth>} />
                  <Route path="/admin" element={<RequireAuth><ProtectedAdminRoute><AdminPanel /></ProtectedAdminRoute></RequireAuth>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </TimerProvider>
      </PremiumProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

