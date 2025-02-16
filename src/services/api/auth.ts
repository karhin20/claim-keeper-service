// Define types for authentication
interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: string;
  phone: string;
  registrationKey: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Session {
  user: User;
  access_token: string;
}

interface SignUpResponse {
  user: User | null;
  message: string;
}

// Update the API_URL definition to ensure it has a fallback and include /api
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://claims-backends.vercel.app/api';

const defaultFetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  mode: 'cors'
};

const authApi = {
  signUp: async (formData: SignUpData): Promise<SignUpResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        credentials: 'include',
        headers: defaultFetchOptions.headers,
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      // If we get a message but response is not ok, it might be an expected error (like email confirmation needed)
      if (!response.ok) {
        if (data.message) {
          return {
            user: null,
            message: data.message
          };
        }
        throw new Error(data.message || 'Signup failed');
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  signIn: async (email: string, password: string): Promise<{ session: Session }> => {
    try {
      console.log('Attempting sign in for:', email);
      const response = await fetch(`${API_URL}/auth/signin`, {
        ...defaultFetchOptions,
        method: 'POST',
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          password 
        })
      });

      const data = await response.json();
      console.log('Sign in response:', { ok: response.ok, status: response.status });

      if (!response.ok) {
        console.error('Sign in error:', data);
        throw new Error(data.message || 'Failed to sign in');
      }

      if (!data.session || !data.session.access_token || !data.session.user) {
        console.error('Invalid session data:', data);
        throw new Error('Invalid session data received');
      }
      
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error instanceof Error ? error : new Error('Failed to sign in');
    }
  },

  signOut: async () => {
    const response = await fetch(`${API_URL}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
  },

  getSession: async (): Promise<{ session: Session | null }> => {
    try {
      const response = await fetch(`${API_URL}/auth/session`, {
        ...defaultFetchOptions,
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { session: null };
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to get session');
      }

      return response.json();
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null };
    }
  },

  checkSession: async () => {
    try {
      const { session } = await authApi.getSession();
      return session;
    } catch (error) {
      console.error('Check session error:', error);
      return null;
    }
  },

  subscribeToAuthChanges: (callback: (session: Session | null) => void) => {
    let mounted = true;

    const checkAuth = async () => {
      if (!mounted) return;
      const session = await authApi.checkSession();
      callback(session);
    };

    // Initial check
    checkAuth();

    // Poll every 5 minutes
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);

    // Return cleanup function
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/update-password`, {
        credentials: 'include',
        headers: defaultFetchOptions.headers,
        method: 'POST',
        body: JSON.stringify({ password: newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password update failed');
      return data;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  },

  requestPasswordReset: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/request-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  signInWithMagicLink: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
};
export { authApi }; 
