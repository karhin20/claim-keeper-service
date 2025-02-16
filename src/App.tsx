import { Toaster } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRouteComponent from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Claims from "./pages/Claims";
import Employees from "./pages/Employees";
import NewClaim from "./pages/NewClaim";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthCallback from "./pages/AuthCallback";
import { useEffect, useState } from 'react';
import { authApi } from './services/api/auth';

const queryClient = new QueryClient();

// Create a protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authApi.subscribeToAuthChanges((newSession) => {
      console.log('Auth state changed:', { hasSession: !!newSession });
      setSession(newSession);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthRedirect = (Component: React.ComponentType) => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>;
    }
    return session ? <Component /> : <Navigate to="/login" />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route 
                path="/login" 
                element={session ? <Navigate to="/dashboard" /> : <Login />} 
              />
              <Route 
                path="/signup" 
                element={session ? <Navigate to="/dashboard" /> : <SignUp />} 
              />
              <Route 
                path="/reset-password" 
                element={session ? <Navigate to="/dashboard" /> : <ResetPassword />} 
              />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRouteComponent>
                    <Dashboard />
                  </ProtectedRouteComponent>
                } 
              />
              <Route 
                path="/claims" 
                element={
                  <ProtectedRouteComponent>
                    <ErrorBoundary>
                      <Claims />
                    </ErrorBoundary>
                  </ProtectedRouteComponent>
                } 
              />
              <Route 
                path="/claims/new" 
                element={
                  <ProtectedRouteComponent>
                    <ErrorBoundary>
                      <NewClaim />
                    </ErrorBoundary>
                  </ProtectedRouteComponent>
                } 
              />
              <Route path="/employees" element={
                <ProtectedRouteComponent>
                  <Employees />
                </ProtectedRouteComponent>
              } />
              <Route path="/contact" element={
                <ProtectedRouteComponent>
                  <Contact />
                </ProtectedRouteComponent>
              } />

              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
