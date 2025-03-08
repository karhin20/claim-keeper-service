import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClaimData } from "@/types/claim";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { claimsApi } from "@/services/api/claims";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNavigate } from 'react-router-dom';

const initialClaimData: ClaimData = {
  claimant_name: "",
  claimant_id: "",
  email: "",
  phone: "",
  address: "",
  incident_date: format(new Date(), 'yyyy-MM-dd'),
  incident_location: "",
  claim_type: "medical" as const,
  claim_amount: 0,
  description: "",
  supporting_documents: [],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const NewClaim = () => {
  const [claimData, setClaimData] = useLocalStorage<ClaimData>(
    'draft-claim',
    initialClaimData
  );
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ClaimData, string>>>({});
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Clear the error for this field as soon as user starts typing
    if (errors[name as keyof ClaimData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ClaimData];
        return newErrors;
      });
    }
    
    setClaimData((prev) => ({
      ...prev,
      [name]: name === 'claim_amount' ? 
        (value === '' ? 0 : Number(value)) :
        value
    }));
  };

  const handleSelectChange = (value: string) => {
    // Clear error for claim_type if it exists
    if (errors.claim_type) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.claim_type;
        return newErrors;
      });
    }
    
    setClaimData((prev) => ({
      ...prev,
      claim_type: value as ClaimData["claim_type"],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear supporting_documents error if it exists
    if (errors.supporting_documents) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.supporting_documents;
        return newErrors;
      });
    }
    
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return false;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} must be JPEG, PNG, or PDF`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setFiles(validFiles);
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ClaimData, string>> = {};
    let isValid = true;
    
    // Required fields validation
    if (!claimData.claimant_name.trim()) {
      newErrors.claimant_name = 'Claimant name is required';
      isValid = false;
    }
    
    if (!claimData.claimant_id.trim()) {
      newErrors.claimant_id = 'Claimant ID is required';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!claimData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(claimData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!claimData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!phoneRegex.test(claimData.phone)) {
      newErrors.phone = 'Invalid phone number format';
      isValid = false;
    }

    if (!claimData.address.trim()) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    if (!claimData.incident_date) {
      newErrors.incident_date = 'Incident date is required';
      isValid = false;
    } else {
      const date = new Date(claimData.incident_date);
      if (isNaN(date.getTime()) || date > new Date()) {
        newErrors.incident_date = 'Invalid date or date is in the future';
        isValid = false;
      }
    }

    if (!claimData.incident_location.trim()) {
      newErrors.incident_location = 'Incident location is required';
      isValid = false;
    }

    // Validate claim amount
    if (typeof claimData.claim_amount !== 'number') {
      newErrors.claim_amount = 'Claim amount must be a number';
      isValid = false;
    } else if (claimData.claim_amount <= 0) {
      newErrors.claim_amount = 'Claim amount must be greater than 0';
      isValid = false;
    }

    if (!claimData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    // Set the errors state
    setErrors(newErrors);
    
    // Return validation result
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirmDialogOpen(true);
  };

  const submitClaim = async (data: ClaimData) => {
    try {
      setIsSubmitting(true);
      
      console.log('Submitting claim with files:', files.length);
      
      // Create a new FormData instance
      const formData = new FormData();
      
      // Clone the data object without files
      const claimDataForSubmission = {
        claimant_name: data.claimant_name,
        claimant_id: data.claimant_id,
        email: data.email,
        phone: data.phone,
        address: data.address,
        incident_date: data.incident_date,
        incident_location: data.incident_location,
        claim_type: data.claim_type,
        claim_amount: data.claim_amount,
        description: data.description,
        supporting_documents: files
      };
      
      await claimsApi.createClaim(claimDataForSubmission);

      toast({
        title: "Success",
        description: "Claim submitted successfully"
      });
      
      // Clear the draft after successful submission
      clearDraft();
      
      navigate('/claims');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmDialogOpen(false);
    }
  };

  const clearDraft = () => {
    setClaimData(initialClaimData);
    localStorage.removeItem('draft-claim');
  };

  const PreviewSection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Preview Claim Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Claimant Name</Label>
          <p className="mt-1">{claimData.claimant_name}</p>
        </div>
        <div>
          <Label>Claimant ID</Label>
          <p className="mt-1">{claimData.claimant_id}</p>
        </div>
        <div>
          <Label>Email</Label>
          <p className="mt-1">{claimData.email}</p>
        </div>
        <div>
          <Label>Phone</Label>
          <p className="mt-1">{claimData.phone}</p>
        </div>
        <div className="col-span-2">
          <Label>Address</Label>
          <p className="mt-1">{claimData.address}</p>
        </div>
        <div>
          <Label>Incident Date</Label>
          <p className="mt-1">{claimData.incident_date}</p>
        </div>
        <div>
          <Label>Incident Location</Label>
          <p className="mt-1">{claimData.incident_location}</p>
        </div>
        <div>
          <Label>Claim Type</Label>
          <p className="mt-1 capitalize">{claimData.claim_type}</p>
        </div>
        <div>
          <Label>Claim Amount</Label>
          <p className="mt-1">₵{typeof claimData.claim_amount === 'number' ? 
            claimData.claim_amount.toFixed(2) : 
            '0.00'
          }</p>
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <p className="mt-1">{claimData.description}</p>
        </div>
        <div className="col-span-2">
          <Label>Supporting Documents</Label>
          <ul className="mt-1 list-disc list-inside">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Claim</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isPreviewing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimant_name" className="required">Claimant Name</Label>
                  <Input
                    id="claimant_name"
                    name="claimant_name"
                    value={claimData.claimant_name}
                    onChange={handleInputChange}
                    className={errors.claimant_name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.claimant_name && (
                    <p className="text-sm text-red-500">{errors.claimant_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimant_id">Claimant ID</Label>
                  <Input
                    id="claimant_id"
                    name="claimant_id"
                    value={claimData.claimant_id}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={claimData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={claimData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={claimData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident_date">Incident Date</Label>
                  <Input
                    id="incident_date"
                    name="incident_date"
                    type="date"
                    value={claimData.incident_date || format(new Date(), 'yyyy-MM-dd')}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident_location">Incident Location</Label>
                  <Input
                    id="incident_location"
                    name="incident_location"
                    value={claimData.incident_location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claim_type">Claim Type</Label>
                  <Select
                    value={claimData.claim_type || 'medical'}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claim_amount">Claim Amount (₵)</Label>
                  <Input
                    id="claim_amount"
                    name="claim_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={claimData.claim_amount || 0}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={claimData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="documents">Supporting Documents</Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    // Run validation
                    const isValid = validateForm();
                    
                    // Log for debugging
                    console.log('Validation result:', isValid, 'Errors:', errors);
                    
                    if (isValid) {
                      setIsPreviewing(true);
                    } else {
                      // Display only the first error for clarity
                      const firstError = Object.values(errors)[0];
                      toast({
                        title: "Validation Error",
                        description: firstError || "Please fill in all required fields correctly before previewing.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Preview
                </Button>
              </div>
            </>
          ) : (
            <>
              <PreviewSection />
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviewing(false)}
                >
                  Edit
                </Button>
                <Button 
                  onClick={() => submitClaim(claimData)} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Card>
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              Please review your claim details before submitting. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Claimant Name</p>
                <p>{claimData.claimant_name}</p>
              </div>
              <div>
                <p className="font-medium">Claim Amount</p>
                <p>₵{typeof claimData.claim_amount === 'number' ? 
                  claimData.claim_amount.toFixed(2) : 
                  '0.00'
                }</p>
              </div>
              {/* Add other fields */}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Back to Edit
            </Button>
            <Button onClick={() => submitClaim(claimData)}>
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewClaim;
