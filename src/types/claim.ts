export interface ClaimData {
  claimantName: string;
  claimantId: string;
  email: string;
  phone: string;
  address: string;
  incidentDate: string;
  incidentLocation: string;
  claimType: "medical" | "property" | "vehicle" | "other";
  claimAmount: number;
  description: string;
  supportingDocuments: File[];
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected';
  submittedAt?: string;
} 