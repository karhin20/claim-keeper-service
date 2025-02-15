import { createClient } from '@supabase/supabase-js';

// Types for better type safety
export interface Database {
  public: {
    Tables: {
      claims: {
        Row: {
          id: string;
          created_at: string;
          status: 'pending' | 'approved' | 'rejected';
          // ... other fields
        };
        Insert: {
          status?: 'pending' | 'approved' | 'rejected';
          // ... other fields
        };
        Update: {
          status?: 'pending' | 'approved' | 'rejected';
          // ... other fields
        };
      };
      admin_staff: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: string;
          email: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          role: string;
          email: string;
          phone?: string;
        };
        Update: {
          name?: string;
          role?: string;
          email?: string;
          phone?: string;
        };
      };
      // ... other tables
    };
  };
}

// Error handling utility
export class SupabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Helper functions for error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw new SupabaseError(
    error.message || 'An unexpected error occurred',
    error.code
  );
};

// This file can be deleted as we'll handle everything through the backend API 