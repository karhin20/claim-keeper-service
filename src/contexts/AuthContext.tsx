import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { authApi } from '@/services/api/auth';

interface AuthContextType {
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (formData: SignUpData) => Promise<void>; // Add signUp function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authApi.signOut();
      // Use a function updater to avoid stale closures
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (formData: SignUpData) => {
    try {
      setLoading(true);
      await authApi.signUp(formData);
    } catch (error) {
      console.error('Sign up error:', error);
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
    signOut,
    signUp // Add signUp to context value
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