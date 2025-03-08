import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { claimsApi } from "@/services/api/claims";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, RefreshCcw, Search, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Claim {
  id: string;
  claimant_name: string;
  claimant_id: string;
  claim_type: string;
  claim_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'reviewing' | 'confirmed' | 'payment_pending' | 'paid';
  submitted_at: string;
  updated_at: string;
  incident_date: string;
  incident_location: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  supporting_documents?: Array<{ name: string }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-blue-500';
    case 'confirmed':
      return 'bg-green-500';
    case 'payment_pending':
      return 'bg-purple-500';
    case 'paid':
      return 'bg-emerald-500';
    case 'rejected':
      return 'bg-red-500';
    case 'reviewing':
      return 'bg-yellow-500';
    default:
      return 'bg-blue-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'payment_pending':
      return <Clock className="h-4 w-4" />;
    case 'paid':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    case 'reviewing':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatAmount = (amount: number | null | undefined) => {
  if (typeof amount !== 'number') return '₵0.00';
  return `₵${amount.toFixed(2)}`;
};

const ClaimsSummary = ({ claims }: { claims: Claim[] }) => {
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c?.status === 'pending').length;
  const reviewingClaims = claims.filter(c => c?.status === 'reviewing').length;
  const approvedClaims = claims.filter(c => c?.status === 'approved').length;
  const confirmedClaims = claims.filter(c => c?.status === 'confirmed').length;
  const paidClaims = claims.filter(c => c?.status === 'paid').length;
  const rejectedClaims = claims.filter(c => c?.status === 'rejected').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Claims</h3>
        <p className="text-xl md:text-2xl font-bold">{totalClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Pending</h3>
        <p className="text-xl md:text-2xl font-bold text-blue-600">{pendingClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Reviewing</h3>
        <p className="text-xl md:text-2xl font-bold text-yellow-600">{reviewingClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Approved</h3>
        <p className="text-xl md:text-2xl font-bold text-blue-600">{approvedClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Confirmed</h3>
        <p className="text-xl md:text-2xl font-bold text-green-600">{confirmedClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Paid</h3>
        <p className="text-xl md:text-2xl font-bold text-emerald-600">{paidClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
        <p className="text-xl md:text-2xl font-bold text-red-600">{rejectedClaims}</p>
      </Card>
    </div>
  );
};

const Claims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'approval' | 'payment'>('approval');
  const navigate = useNavigate();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status');
  const idFromUrl = searchParams.get('id');

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const claimsData = await claimsApi.getClaims();
      setClaims(claimsData || []);
    } catch (error) {
      console.error("Failed to load claims:", error);
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    if (statusFromUrl && ['pending', 'approved', 'reviewing', 'confirmed', 'rejected', 'payment_pending', 'paid'].includes(statusFromUrl)) {
      setStatusFilter(statusFromUrl);
    }
  }, [statusFromUrl]);

  useEffect(() => {
    if (idFromUrl && claims.length > 0) {
      const claim = claims.find(c => c.id === idFromUrl);
      if (claim) {
        setSelectedClaim(claim);
        setIsDetailOpen(true);
      }
    }
  }, [idFromUrl, claims]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === id ? { ...claim, status: status as any } : claim
        )
      );
      
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim(prev => prev ? { ...prev, status: status as any } : null);
      }
      
      if (status === 'pending') {
        setIsDetailOpen(false);
      }
      
      await claimsApi.updateClaim(id, { status });
      
      toast.success(`Claim ${status.replace('_', ' ')}`);
      
      fetchClaims();
    } catch (error) {
      toast.error("Failed to update claim status");
      fetchClaims();
    }
  };

  const handleReturnToPending = async (id: string) => {
    try {
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === id ? { ...claim, status: 'pending' } : claim
        )
      );
      
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim(prev => prev ? { ...prev, status: 'pending' } : null);
      }
      
      setIsDetailOpen(false);
      
      await claimsApi.updateClaim(id, { status: 'pending' });
      
      toast.success("Claim returned to pending status");
      
      fetchClaims();
    } catch (error) {
      toast.error("Failed to update claim status");
      fetchClaims();
    }
  };

  const handleApproveAndGenerateOTP = async (id: string) => {
    try {
      toast.loading("Approving claim and generating verification code...");
      
      const response = await claimsApi.generateApprovalOTP(id);
      
      toast.dismiss();
      
      if (response.otp && import.meta.env.DEV) {
        toast.success("Claim approved and verification code generated", {
          description: `Development OTP: ${response.otp}`
        });
      } else {
        toast.success("Claim approved and verification code sent to claimant");
      }
      
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === id ? { ...claim, status: 'approved' } : claim
        )
      );
      
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim(prev => prev ? { ...prev, status: 'approved' } : null);
      }
      
      setIsDetailOpen(false);
      
      fetchClaims();
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to approve claim", {
        description: error.message || "Please try again"
      });
    }
  };

  const handleVerifyClaim = async (id: string) => {
    setSelectedClaim(claims.find(claim => claim.id === id) || null);
    setIsOtpDialogOpen(true);
  };

  const handleOTPVerification = async (id: string) => {
    try {
      toast.loading("Verifying code...");
      
      await claimsApi.verifyApprovalOTP(id, otpInput);
      
      toast.dismiss();
      toast.success("Claim verified and confirmed");
      
      setIsOtpDialogOpen(false);
      setOtpInput('');
      
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === id ? { ...claim, status: 'confirmed' } : claim
        )
      );
      
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim(prev => prev ? { ...prev, status: 'confirmed' } : null);
      }
      
      setIsDetailOpen(false);
      
      fetchClaims();
    } catch (error: any) {
      toast.dismiss();
      toast.error("Verification failed", {
        description: error.message || "Invalid verification code"
      });
    }
  };

  const handleInitiatePayment = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedClaim) return;
    
    try {
      await handleStatusUpdate(selectedClaim.id, 'payment_pending');
      setIsPaymentDialogOpen(false);
      toast.success("Payment status updated. Verification required.");
    } catch (error) {
      toast.error("Failed to process payment");
    }
  };

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsDetailOpen(true);
  };

  const handleResendOTP = async (id: string) => {
    try {
      toast.loading("Resending verification code...");
      
      const response = await claimsApi.generateApprovalOTP(id);
      
      toast.dismiss();
      
      if (response.otp && import.meta.env.DEV) {
        toast.success("Verification code resent", {
          description: `Development OTP: ${response.otp}`
        });
      } else {
        toast.success("Verification code resent to claimant");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to resend verification code", {
        description: error.message || "Please try again"
      });
    }
  };

  const handleApproveForPayment = async (id: string) => {
    try {
      toast.loading("Processing payment...");
      
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === id ? { ...claim, status: 'payment_pending' } : claim
        )
      );
      
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim(prev => prev ? { ...prev, status: 'payment_pending' } : null);
      }
      
      await claimsApi.updateClaim(id, { status: 'payment_pending' });
      
      toast.dismiss();
      toast.success("Claim approved for payment");
      
      setIsDetailOpen(false);
      fetchClaims();
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to process payment", {
        description: error.message || "Please try again"
      });
      fetchClaims();
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      toast.loading("Marking as paid...");
      
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === id ? { ...claim, status: 'paid' } : claim
        )
      );
      
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim(prev => prev ? { ...prev, status: 'paid' } : null);
      }
      
      await claimsApi.updateClaim(id, { status: 'paid' });
      
      try {
        if (selectedClaim) {
          toast.success("Payment confirmation sent to claimant");
        }
      } catch (notificationError) {
        console.error("Failed to send payment notification:", notificationError);
      }
      
      toast.dismiss();
      toast.success("Payment completed successfully");
      
      setIsDetailOpen(false);
      fetchClaims();
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to mark as paid", {
        description: error.message || "Please try again"
      });
      fetchClaims();
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (statusFilter !== 'all' && claim.status !== statusFilter) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        claim.claimant_name.toLowerCase().includes(searchLower) ||
        claim.claimant_id.toLowerCase().includes(searchLower) ||
        claim.claim_type.toLowerCase().includes(searchLower) ||
        claim.email?.toLowerCase().includes(searchLower) ||
        claim.phone?.includes(searchTerm)
      );
    }
    
    return true;
  });

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please log in to view claims</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Claims Management</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={fetchClaims}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={16} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate('/new-claim')}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            New Claim
          </Button>
        </div>
      </div>

      <ClaimsSummary claims={filteredClaims} />

      <Card className="mb-6">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Search by name, ID, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="status-filter" className="sr-only">Filter by Status</Label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Claims</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="payment_pending">Payment Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Spinner size="lg" />
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-gray-500">No claims found</p>
            {searchTerm || statusFilter !== 'all' ? (
              <Button 
                variant="link" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claimant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">
                    {claim.claimant_name}
                    <div className="text-xs text-gray-500">{claim.claimant_id}</div>
                  </TableCell>
                  <TableCell>{claim.claim_type}</TableCell>
                  <TableCell>{formatAmount(claim.claim_amount)}</TableCell>
                  <TableCell>
                    <Badge className={`flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                      {getStatusIcon(claim.status)}
                      <span className="capitalize">{claim.status.replace('_', ' ')}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(claim.submitted_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(claim)}
                      >
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              View and manage claim information
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{selectedClaim.claimant_name}</h3>
                  <p className="text-sm text-gray-500">ID: {selectedClaim.claimant_id}</p>
                </div>
                <Badge className={`${getStatusColor(selectedClaim.status)} flex items-center gap-1`}>
                  {getStatusIcon(selectedClaim.status)}
                  <span className="capitalize">{selectedClaim.status.replace('_', ' ')}</span>
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Claim Information</h3>
                  <p><span className="font-medium">Type:</span> {selectedClaim.claim_type}</p>
                  <p><span className="font-medium">Amount:</span> {formatAmount(selectedClaim.claim_amount)}</p>
                  <p><span className="font-medium">Submitted:</span> {format(new Date(selectedClaim.submitted_at), 'PPP')}</p>
                  <p><span className="font-medium">Last Updated:</span> {format(new Date(selectedClaim.updated_at), 'PPP')}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Contact Information</h3>
                  <p><span className="font-medium">Email:</span> {selectedClaim.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedClaim.phone}</p>
                  <p><span className="font-medium">Address:</span> {selectedClaim.address}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Incident Details</h3>
                  <p><span className="font-medium">Date:</span> {format(new Date(selectedClaim.incident_date), 'PPP')}</p>
                  <p><span className="font-medium">Location:</span> {selectedClaim.incident_location}</p>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <h3 className="font-semibold">Description</h3>
                  <p>{selectedClaim.description}</p>
                </div>
                {selectedClaim.supporting_documents && selectedClaim.supporting_documents.length > 0 && (
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <h3 className="font-semibold">Supporting Documents</h3>
                    <ul className="list-disc pl-5">
                      {selectedClaim.supporting_documents.map((doc, index) => (
                        <li key={index}>{doc.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {selectedClaim.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedClaim.id, 'reviewing')}
                    >
                      Mark as Reviewing
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setIsRejectDialogOpen(true)}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproveAndGenerateOTP(selectedClaim.id)}
                    >
                      Approve
                    </Button>
                  </>
                )}
                {selectedClaim.status === 'reviewing' && (
                  <>
                    <Button
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleReturnToPending(selectedClaim.id)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return to Pending
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setIsRejectDialogOpen(true)}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproveAndGenerateOTP(selectedClaim.id)}
                    >
                      Approve
                    </Button>
                  </>
                )}
                {selectedClaim.status === 'approved' && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => handleResendOTP(selectedClaim.id)}
                    >
                      Resend OTP
                    </Button>
                    <Button
                      onClick={() => handleVerifyClaim(selectedClaim.id)}
                    >
                      Verify OTP
                    </Button>
                  </div>
                )}
                {selectedClaim.status === 'confirmed' && (
                  <Button
                    onClick={() => handleApproveForPayment(selectedClaim.id)}
                  >
                    Approve for Payment
                  </Button>
                )}
                {selectedClaim.status === 'payment_pending' && (
                  <Button
                    onClick={() => handleMarkAsPaid(selectedClaim.id)}
                  >
                    Mark as Paid
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Claim</DialogTitle>
            <DialogDescription>
              Enter the verification code provided by the claimant to confirm the claim.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 6-digit code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOtpDialogOpen(false);
                setOtpInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedClaim && handleOTPVerification(selectedClaim.id)}
            >
              Verify & Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Confirm payment processing for this claim.
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="py-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Claimant:</span>
                <span>{selectedClaim.claimant_name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Claim Type:</span>
                <span>{selectedClaim.claim_type}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Amount:</span>
                <span className="font-bold">{formatAmount(selectedClaim.claim_amount)}</span>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  After confirming, you'll need to verify the payment with an OTP.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
            >
              Confirm & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this claim? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                selectedClaim && handleStatusUpdate(selectedClaim.id, 'rejected');
                setIsRejectDialogOpen(false);
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Claims;
