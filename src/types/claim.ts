export interface ClaimData {
  claimant_name: string;
  claimant_id: string;
  email: string;
  phone: string;
  address: string;
  incident_date: string;
  incident_location: string;
  claim_type: "medical" | "property" | "vehicle" | "other";
  claim_amount: number;
  description: string;
  supporting_documents?: File[];
}

export interface Claim {
  id: string;
  claimant_name: string;
  claimant_id: string;
  email: string;
  phone: string;
  address: string;
  incident_date: string;
  incident_location: string;
  claim_type: string;
  claim_amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'reviewing';
  submitted_at: string;
  updated_at: string;
  supporting_documents?: Array<{ name: string }>;
} 