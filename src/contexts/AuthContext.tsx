import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { authApi } from '@/services/api/auth';

interface AuthContextType {
  user: User | null;
  signUp: (formData: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: string;
  phone: string;
  registrationKey: string;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authApi.getSession();
        setUser(session.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signUp = async (formData: SignUpData) => {
    await authApi.signUp(formData);
  };

  const signIn = async (email: string, password: string) => {
    await authApi.signIn(email, password);
  };

  const signOut = async () => {
    await authApi.signOut();
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 