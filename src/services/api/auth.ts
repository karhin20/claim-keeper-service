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
  token: string;
}

interface SignUpResponse {
  user: User | null;
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const authApi = {
  signUp: async (formData: SignUpData): Promise<SignUpResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        credentials: 'include',
        headers: defaultHeaders,
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

  signIn: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      credentials: 'include',
      headers: defaultHeaders,
      body: JSON.stringify({ 
        email: email.toLowerCase().trim(),
        password 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sign in');
    }

    return response.json();
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

  getSession: async () => {
    const response = await fetch(`${API_URL}/auth/session`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  checkSession: async () => {
    const { session } = await authApi.getSession();
    return session;
  },

  subscribeToAuthChanges: (callback: (session: Session | null) => void) => {
    // Initial check
    authApi.checkSession().then(callback);

    // Poll every 5 minutes
    const intervalId = setInterval(() => {
      authApi.checkSession().then(callback);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
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
        headers: defaultHeaders,
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
