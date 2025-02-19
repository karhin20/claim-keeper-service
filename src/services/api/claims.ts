import { Claim } from '@/types/claim';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://claims-backends.vercel.app/api';

interface ClaimsStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// Enhanced fetch options with explicit cookie handling
const fetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Ensure cookies are sent even in cross-origin requests
  mode: 'cors',
  // Add cache control to prevent caching of auth responses
  cache: 'no-cache'
};

export const claimsApi = {
  getClaims: async (): Promise<Claim[]> => {
    try {
      console.log('Fetching claims from:', `${API_URL}/claims`);
      const response = await fetch(`${API_URL}/claims`, {
        ...fetchOptions,
        method: 'GET'
      });

      // Log response details for debugging
      console.log('Claims response status:', response.status);
      console.log('Claims response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch claims');
      }

      const data = await response.json();
      return data.claims;
    } catch (error) {
      console.error('Get claims error:', error);
      throw error;
    }
  },

  createClaim: async (claimData: Omit<Claim, 'id' | 'status' | 'submitted_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_URL}/claims`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify(claimData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create claim');
      }

      return response.json();
    } catch (error) {
      console.error('Create claim error:', error);
      throw error;
    }
  },

  updateClaim: async (id: string, updates: Partial<Claim>) => {
    try {
      const response = await fetch(`${API_URL}/claims/${id}`, {
        ...fetchOptions,
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update claim');
      }

      return response.json();
    } catch (error) {
      console.error('Update claim error:', error);
      throw error;
    }
  },

  generateApprovalOTP: async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}/generate-otp`, {
        ...fetchOptions,
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate OTP');
      }

      return response.json();
    } catch (error) {
      console.error('Generate OTP error:', error);
      throw error;
    }
  },

  verifyApprovalOTP: async (id: string, otp: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}/verify-otp`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({ otp })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify OTP');
      }

      return response.json();
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },

  getStats: async (): Promise<ClaimsStats> => {
    try {
      const response = await fetch(`${API_URL}/claims/stats`, {
        ...fetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch stats');
      }

      return response.json();
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  },

  getRecentActivity: async (): Promise<Claim[]> => {
    try {
      const response = await fetch(`${API_URL}/claims/recent`, {
        ...fetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch recent activity');
      }

      return response.json();
    } catch (error) {
      console.error('Get recent activity error:', error);
      throw error;
    }
  }
}; 