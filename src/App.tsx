import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import ResourceDetail from "./pages/ResourceDetail";
import Profile from "./pages/Profile";
import MyLoans from "./pages/MyLoans";
import MyRequests from "./pages/MyRequests";
import MyItems from "./pages/MyItems";
import Exchanges from "./pages/Exchanges";
import ExchangeDetail from "./pages/ExchangeDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AccountSetup from "./pages/AccountSetup";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            {/* Account provisioning routes — no auth required */}
            <Route path="/setup" element={<AccountSetup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Student routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/loans" element={<MyLoans />} />
            <Route path="/requests" element={<MyRequests />} />
            <Route path="/my-items" element={<MyItems />} />
            <Route path="/exchanges" element={<Exchanges />} />
            <Route path="/exchanges/:id" element={<ExchangeDetail />} />
            {/* Legacy transaction routes redirect to exchanges */}
            <Route path="/transactions" element={<Navigate to="/exchanges" replace />} />
            <Route path="/transactions/:id" element={<Navigate to="/exchanges" replace />} />
            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
