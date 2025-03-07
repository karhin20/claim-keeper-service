import { Toaster } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from '@/components/ProtectedRoute';
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
import VerifyClaims from "@/pages/VerifyClaims";
import { Layout } from "@/components/Layout";
import Spinner from "@/components/ui/spinner";

const queryClient = new QueryClient();

// Create a routing guard component with loop prevention
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  // Add a key "authenticated" to prevent re-renders when auth state doesn't change
  return loading ? (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  ) : session ? (
    children
  ) : (
    // Use replace to prevent adding to history
    <Navigate to="/login" replace />
  );
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  // Don't redirect while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  
  // If already authenticated, redirect to dashboard
  return !session ? children : <Navigate to="/dashboard" replace />;
}

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
                element={
                  <PublicOnly>
                    <Login />
                  </PublicOnly>
                } 
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
                  <RequireAuth>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </RequireAuth>
                } 
              />
              <Route 
                path="/claims" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ErrorBoundary>
                      <Layout>
                        <Claims />
                      </Layout>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/claims/new" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <NewClaim />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route path="/employees" element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              } />
              <Route path="/contact" element={
                <ProtectedRoute>
                  <Contact />
                </ProtectedRoute>
              } />
              <Route 
                path="/verify-claims" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <VerifyClaims />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

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
