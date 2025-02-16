import { ClaimData } from "@/types/claim";

interface Claim {
  id: string;
  claimant_name: string;
  claimant_id: string;
  claim_type: string;
  claim_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  incident_date: string;
  incident_location: string;
  description: string;
  email: string;
  phone: string;
  address: string;
}

interface ClaimsStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const API_URL = `${import.meta.env.VITE_API_URL}/api` || 'https://claims-backends.vercel.app/api';

const defaultFetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const handleApiError = async (response: Response) => {
  const error = await response.json();
  throw new Error(error.message || 'An error occurred');
};

export const claimsApi = {
  submitClaim: async (claimData: ClaimData) => {
    try {
      const response = await fetch(`${API_URL}/claims`, {
        ...defaultFetchOptions,
        method: 'POST',
        body: JSON.stringify(claimData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit claim');
      return data;
    } catch (error) {
      console.error('Claim submission error:', error);
      throw error;
    }
  },

  getClaims: async (): Promise<Claim[]> => {
    try {
      const response = await fetch(`${API_URL}/claims`, {
        ...defaultFetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Get claims error:', error);
      throw error;
    }
  },

  updateClaim: async (claimId: string, updates: Partial<ClaimData>) => {
    try {
      const response = await fetch(`${API_URL}/claims/${claimId}`, {
        ...defaultFetchOptions,
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update claim');
      return data;
    } catch (error) {
      console.error('Update claim error:', error);
      throw error;
    }
  },

  generateApprovalOTP: async (claimId: string) => {
    try {
      const response = await fetch(`${API_URL}/claims/${claimId}/generate-otp`, {
        ...defaultFetchOptions,
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to generate OTP');
      return data;
    } catch (error) {
      console.error('Generate OTP error:', error);
      throw error;
    }
  },

  verifyApprovalOTP: async (claimId: string, otp: string) => {
    try {
      const response = await fetch(`${API_URL}/claims/${claimId}/verify-otp`, {
        ...defaultFetchOptions,
        method: 'POST',
        body: JSON.stringify({ otp })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to verify OTP');
      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },

  getStats: async (): Promise<ClaimsStats> => {
    try {
      const response = await fetch(`${API_URL}/claims/stats`, {
        ...defaultFetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching claims stats:', error);
      throw error;
    }
  },

  getRecentActivity: async (): Promise<Claim[]> => {
    try {
      const response = await fetch(`${API_URL}/claims/recent`, {
        ...defaultFetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching recent claims:', error);
      throw error;
    }
  }
}; 