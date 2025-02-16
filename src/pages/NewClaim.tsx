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
  incident_date: "",
  incident_location: "",
  claim_type: "medical",
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
    setClaimData((prev) => ({
      ...prev,
      [name]: name === 'claim_amount' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setClaimData((prev) => ({
      ...prev,
      claim_type: value as ClaimData["claim_type"],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Required fields validation
    if (!claimData.claimant_name.trim()) {
      newErrors.claimant_name = 'Claimant name is required';
    }
    
    if (!claimData.claimant_id.trim()) {
      newErrors.claimant_id = 'Claimant ID is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!claimData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(claimData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!claimData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(claimData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!claimData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!claimData.incident_date) {
      newErrors.incident_date = 'Incident date is required';
    } else {
      const date = new Date(claimData.incident_date);
      if (isNaN(date.getTime()) || date > new Date()) {
        newErrors.incident_date = 'Invalid date or date is in the future';
      }
    }

    if (!claimData.incident_location.trim()) {
      newErrors.incident_location = 'Incident location is required';
    }

    // Validate claim amount
    if (typeof claimData.claim_amount !== 'number') {
      newErrors.claim_amount = 'Claim amount must be a number';
    } else if (claimData.claim_amount <= 0) {
      newErrors.claim_amount = 'Claim amount must be greater than 0';
    }

    if (!claimData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      await claimsApi.createClaim({
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
      });

      toast({
        title: "Success",
        description: "Claim submitted successfully"
      });
      navigate('/claims');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Error",
        description: "Failed to submit claim",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
                    value={claimData.incident_date}
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
                    value={claimData.claim_type}
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
                    value={claimData.claim_amount}
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
                  onClick={() => setIsPreviewing(true)}
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
                <Button type="submit">Submit Claim</Button>
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
