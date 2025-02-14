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

const initialClaimData: ClaimData = {
  claimantName: "",
  claimantId: "",
  email: "",
  phone: "",
  address: "",
  incidentDate: "",
  incidentLocation: "",
  claimType: "medical",
  claimAmount: 0,
  description: "",
  supportingDocuments: [],
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setClaimData((prev) => ({
      ...prev,
      [name]: name === 'claimAmount' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setClaimData((prev) => ({
      ...prev,
      claimType: value as ClaimData["claimType"],
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
    if (!claimData.claimantName.trim()) {
      newErrors.claimantName = 'Claimant name is required';
    }
    
    if (!claimData.claimantId.trim()) {
      newErrors.claimantId = 'Claimant ID is required';
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

    if (!claimData.incidentDate) {
      newErrors.incidentDate = 'Incident date is required';
    } else {
      const date = new Date(claimData.incidentDate);
      if (isNaN(date.getTime()) || date > new Date()) {
        newErrors.incidentDate = 'Invalid date or date is in the future';
      }
    }

    if (!claimData.incidentLocation.trim()) {
      newErrors.incidentLocation = 'Incident location is required';
    }

    // Validate claim amount
    if (typeof claimData.claimAmount !== 'number') {
      newErrors.claimAmount = 'Claim amount must be a number';
    } else if (claimData.claimAmount <= 0) {
      newErrors.claimAmount = 'Claim amount must be greater than 0';
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

  const submitClaim = async () => {
    try {
      await claimsApi.submitClaim({
        ...claimData,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      });

      clearDraft();
      toast({
        title: "Success",
        description: "Your claim has been submitted successfully.",
      });

      setIsPreviewing(false);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
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
          <p className="mt-1">{claimData.claimantName}</p>
        </div>
        <div>
          <Label>Claimant ID</Label>
          <p className="mt-1">{claimData.claimantId}</p>
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
          <p className="mt-1">{claimData.incidentDate}</p>
        </div>
        <div>
          <Label>Incident Location</Label>
          <p className="mt-1">{claimData.incidentLocation}</p>
        </div>
        <div>
          <Label>Claim Type</Label>
          <p className="mt-1 capitalize">{claimData.claimType}</p>
        </div>
        <div>
          <Label>Claim Amount</Label>
          <p className="mt-1">${typeof claimData.claimAmount === 'number' ? 
            claimData.claimAmount.toFixed(2) : 
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
                  <Label htmlFor="claimantName" className="required">Claimant Name</Label>
                  <Input
                    id="claimantName"
                    name="claimantName"
                    value={claimData.claimantName}
                    onChange={handleInputChange}
                    className={errors.claimantName ? 'border-red-500' : ''}
                    required
                  />
                  {errors.claimantName && (
                    <p className="text-sm text-red-500">{errors.claimantName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimantId">Claimant ID</Label>
                  <Input
                    id="claimantId"
                    name="claimantId"
                    value={claimData.claimantId}
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
                  <Label htmlFor="incidentDate">Incident Date</Label>
                  <Input
                    id="incidentDate"
                    name="incidentDate"
                    type="date"
                    value={claimData.incidentDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incidentLocation">Incident Location</Label>
                  <Input
                    id="incidentLocation"
                    name="incidentLocation"
                    value={claimData.incidentLocation}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimType">Claim Type</Label>
                  <Select
                    value={claimData.claimType}
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
                  <Label htmlFor="claimAmount">Claim Amount ($)</Label>
                  <Input
                    id="claimAmount"
                    name="claimAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={claimData.claimAmount}
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
                <p>{claimData.claimantName}</p>
              </div>
              <div>
                <p className="font-medium">Claim Amount</p>
                <p>${typeof claimData.claimAmount === 'number' ? 
                  claimData.claimAmount.toFixed(2) : 
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
            <Button onClick={submitClaim}>
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewClaim;
