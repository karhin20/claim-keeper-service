import { ClaimData } from "@/types/claim";

const API_URL = import.meta.env.VITE_API_URL || 'https://claims-backends.vercel.app/api';

const defaultFetchOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
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

  getClaims: async () => {
    try {
      const response = await fetch(`${API_URL}/claims`, {
        ...defaultFetchOptions,
        method: 'GET'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch claims');
      return data;
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
  }
}; 