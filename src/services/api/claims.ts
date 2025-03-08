import { Claim } from '@/types/claim';
import { toast } from 'sonner';

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
      const response = await fetch(`${API_URL}/claims`, {
        ...fetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch claims:", error);
      // Return empty array on error
      return [];
    }
  },

  createClaim: async (claimData: Omit<Claim, 'id' | 'status' | 'submitted_at' | 'updated_at'>) => {
    try {
      // Check if we have files to upload
      const hasFiles = claimData.supporting_documents && 
                       Array.isArray(claimData.supporting_documents) && 
                       claimData.supporting_documents.length > 0;
      
      // If files exist, use FormData approach
      if (hasFiles) {
        const formData = new FormData();
        
        // Add all claim data as JSON in a single field
        const claimDataWithoutFiles = { ...claimData };
        delete claimDataWithoutFiles.supporting_documents;
        formData.append('claimData', JSON.stringify(claimDataWithoutFiles));
        
        // Add each file separately
        if (claimData.supporting_documents) {
          claimData.supporting_documents.forEach((file, index) => {
            formData.append(`file${index}`, file);
          });
        }
        
        // Send with multipart content type but without Content-Type header
        // to let the browser set it correctly with boundary
        const formDataOptions = {
          ...fetchOptions,
          method: 'POST',
          body: formData,
          headers: {
            // Remove Content-Type to let browser set it with boundary
            'Accept': 'application/json'
          }
        };
        
        const response = await fetch(`${API_URL}/claims`, formDataOptions);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create claim');
        }
        
        return response.json();
      } else {
        // No files, use regular JSON request
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
      }
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
      const response = await fetch(`${API_URL}/claims/${id}/generate-otp`, {
        ...fetchOptions,
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate OTP');
      }

      const data = await response.json();
      
      // If we're in development and the backend sent the OTP directly
      // (this is our fallback for when email sending fails)
      if (data.otp && import.meta.env.DEV) {
        // Show the OTP in a toast for easy testing
        toast.info(`Development OTP: ${data.otp}`, {
          duration: 10000, // Show for 10 seconds
        });
      }

      return data;
    } catch (error) {
      console.error('Generate OTP error:', error);
      throw error;
    }
  },

  verifyApprovalOTP: async (id: string, otp: string) => {
    try {
      // Skip the pre-check for now since the endpoint is not working
      // Just proceed with verification directly
      const response = await fetch(`${API_URL}/claims/${id}/verify-otp`, {
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
        throw new Error('Failed to fetch stats');
      }

      return await response.json();
    } catch (error) {
      // Return default stats on error
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      };
    }
  },

  getRecentActivity: async (): Promise<Claim[]> => {
    try {
      const response = await fetch(`${API_URL}/claims/recent`, {
        ...fetchOptions,
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }

      return await response.json();
    } catch (error) {
      // Return empty array on error
      return [];
    }
  }
}; 