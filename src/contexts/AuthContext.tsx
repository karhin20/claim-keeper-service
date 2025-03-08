import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { authApi } from '@/services/api/auth';
import { toast } from 'sonner';

interface AuthContextType {
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (formData: SignUpData) => Promise<void>;
  setSession: (session: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Use useCallback to ensure stable function references
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { session: newSession } = await authApi.signIn(email, password);
      setSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      
      // First clear the session state in the context
      setSession(null);
      setUser(null);
      
      // Then call the API to sign out, which will handle the redirection
      await authApi.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      
      // If the API call fails, we'll still want to redirect
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const signUp = useCallback(async (formData: SignUpData) => {
    try {
      setLoading(true);
      console.log("AuthContext signUp called with:", formData);
      const result = await authApi.signUp(formData);
      console.log("SignUp result:", result);
      return result;
    } catch (error) {
      console.error('Sign up error in context:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session only once on mount
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      try {
        const session = await authApi.checkSession();
        if (mounted) {
          setSession(session);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Session check error:', error);
          setSession(null);
          setLoading(false);
        }
      }
    };
    
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Prevent unnecessary context value changes
  const value = {
    session,
    loading,
    signIn,
    signOut: handleSignOut,
    signUp,
    setSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};