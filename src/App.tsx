import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PublicOnly } from "@/components/auth/PublicOnly";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Success from "./pages/Success";
import MyAvailability from "./pages/MyAvailability";
import MyPlan from "./pages/MyPlan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PremiumProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
              <Route path="/app" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/auth" element={<PublicOnly><Auth /></PublicOnly>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/success" element={<Success />} />
              <Route path="/my-schedule" element={<RequireAuth><MyAvailability /></RequireAuth>} />
              <Route path="/my-plan" element={<RequireAuth><MyPlan /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PremiumProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
