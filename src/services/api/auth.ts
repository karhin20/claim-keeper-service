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

// Define types for auth requests
export interface SignInData {
  email: string;
  password: string;
}

// Enhanced fetch options with explicit cookie handling
const fetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  mode: 'cors',
  cache: 'no-cache'
};

const authApi = {
  signUp: async (data: SignUpData): Promise<any> => {
    try {
      console.log("SignUp API call with:", data);
      
      const response = await fetch(`${API_URL}/auth/signup`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      console.log("SignUp response:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to sign up');
      }

      return responseData;
    } catch (error) {
      console.error('SignUp API error:', error);
      throw error;
    }
  },

  signIn: async (email: string, password: string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  signOut: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/signout`, {
        ...fetchOptions,
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sign out');
      }

      // Clear all auth-related storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('auth');
      
      // Clear all cookies by setting their expiration to past
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Set logout flag
      sessionStorage.setItem('justLoggedOut', 'true');
      
      // Reload the page to completely reset the app state
      window.location.href = '/login?logout=true';
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  getSession: async (): Promise<{ session: Session | null }> => {
    try {
      const response = await fetch(`${API_URL}/auth/session`, {
        ...fetchOptions,
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
      return { session: null };
    }
  },

  checkSession: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/auth/session`, {
        ...fetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to check session');
      }

      const data = await response.json();
      return data.session;
    } catch (error) {
      return null;
    }
  },

  subscribeToAuthChanges: (callback: (session: Session | null) => void) => {
    let mounted = true;

    const checkAuth = async () => {
      if (!mounted) return;
      
      // Skip auth check if user just logged out
      const justLoggedOut = sessionStorage.getItem('justLoggedOut') === 'true' || 
                           new URLSearchParams(window.location.search).get('logout') === 'true';
      
      if (justLoggedOut) {
        callback(null); // Force null session
        return;
      }
      
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
      throw error;
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/update-password`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({ password: newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password update failed');
      return data;
    } catch (error) {
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
