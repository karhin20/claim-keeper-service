import { useEffect, useState } from "react";
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
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCcw } from 'lucide-react';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    case 'reviewing':
      return 'bg-yellow-500';
    default:
      return 'bg-blue-500';
  }
};

// Add a helper function to safely format currency
const formatAmount = (amount: number | null | undefined) => {
  if (typeof amount !== 'number') return '₵0.00';
  return `₵${amount.toFixed(2)}`;
};

const ClaimsSummary = ({ claims }: { claims: Claim[] }) => {
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c?.status === 'pending').length;
  const approvedClaims = claims.filter(c => c?.status === 'approved').length;
  const rejectedClaims = claims.filter(c => c?.status === 'rejected').length;
  const totalAmount = claims.reduce((sum, claim) => 
    sum + (typeof claim?.claim_amount === 'number' ? claim.claim_amount : 0), 
  0);

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Claims</h3>
        <p className="text-2xl font-bold">{totalClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Pending</h3>
        <p className="text-2xl font-bold text-blue-600">{pendingClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Approved</h3>
        <p className="text-2xl font-bold text-emerald-600">{approvedClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
        <p className="text-2xl font-bold text-red-600">{rejectedClaims}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
        <p className="text-2xl font-bold">₵{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </Card>
    </div>
  );
};

type SortField = keyof Claim;

const Claims = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('submitted_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PP');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = searchTerm === '' || (
      (claim.claimant_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (claim.claimant_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    try {
      const claimDate = claim.submitted_at ? new Date(claim.submitted_at) : null;
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      const matchesDateRange = 
        (!startDate || (claimDate && claimDate >= startDate)) &&
        (!endDate || (claimDate && claimDate <= endDate));

      return matchesSearch && matchesStatus && matchesDateRange;
    } catch (error) {
      console.error('Date filtering error:', error);
      return matchesSearch && matchesStatus;
    }
  });

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortField === 'claim_amount') {
      return sortDirection === 'asc' ? a[sortField] - b[sortField] : b[sortField] - a[sortField];
    }
    return sortDirection === 'asc' 
      ? String(a[sortField]).localeCompare(String(b[sortField]))
      : String(b[sortField]).localeCompare(String(a[sortField]));
  });

  const totalPages = Math.ceil(sortedClaims.length / itemsPerPage);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const data = await claimsApi.getClaims();
      setClaims(Array.isArray(data) ? data : []);
      toast.success('Claims refreshed successfully');
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error('Failed to fetch claims');
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press '/' to focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      // Press 'Esc' to clear search and filters
      if (e.key === 'Escape') {
        setSearchTerm('');
        setStatusFilter('all');
      }

      // Add pagination shortcuts
      if (e.key === 'ArrowLeft' && !e.ctrlKey) {
        setCurrentPage(p => Math.max(1, p - 1));
      }
      if (e.key === 'ArrowRight' && !e.ctrlKey) {
        setCurrentPage(p => Math.min(totalPages, p + 1));
      }

      // Add export shortcut
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exportToCsv();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, sortedClaims.length]);

  const handleStatusUpdate = async (claimId: string, newStatus: string) => {
    try {
      await claimsApi.updateClaim(claimId, { status: newStatus });
      toast({
        title: "Success",
        description: `Claim ${newStatus} successfully.`,
      });
      fetchClaims(); // Refresh claims list
      setIsApprovalDialogOpen(false);
    } catch (error) {
      console.error('Error updating claim:', error);
      toast({
        title: "Error",
        description: "Failed to update claim status.",
        variant: "destructive",
      });
    }
  };

  const handleApprovalRequest = async (claimId: string) => {
    try {
      await claimsApi.generateApprovalOTP(claimId);
      setOtpDialogOpen(true);
      toast({
        title: "OTP Generated",
        description: "An OTP has been sent for verification.",
      });
    } catch (error) {
      console.error('Error generating OTP:', error);
      toast({
        title: "Error",
        description: "Failed to generate OTP.",
        variant: "destructive",
      });
    }
  };

  const handleOTPVerification = async (claimId: string) => {
    try {
      await claimsApi.verifyApprovalOTP(claimId, otpInput);
      setOtpDialogOpen(false);
      setOtpInput('');
      fetchClaims(); // Refresh claims list
      toast({
        title: "Success",
        description: "Claim approved successfully.",
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCsv = () => {
    const headers = ['Claimant Name', 'ID', 'Type', 'Amount', 'Status', 'Submitted Date'];
    const csvData = claims.map(claim => [
      claim.claimant_name || claim.claimantName || 'N/A',
      claim.claimant_id || claim.claimantId || 'N/A',
      claim.claim_type || claim.claimType || 'N/A',
      claim.claim_amount || claim.claimAmount,
      claim.status || 'pending',
      new Date(claim.submitted_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const paginatedClaims = sortedClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ClaimDetailsDialog = ({ claim }: { claim: Claim }) => (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Claim Details</DialogTitle>
        <DialogDescription>
          Submitted on {formatDate(claim.submitted_at)}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div>
          <h4 className="font-semibold">Claimant Name</h4>
          <p>{claim.claimant_name || claim.claimantName || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold">Claimant ID</h4>
          <p>{claim.claimant_id || claim.claimantId || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold">Email</h4>
          <p>{claim.email}</p>
        </div>
        <div>
          <h4 className="font-semibold">Phone</h4>
          <p>{claim.phone}</p>
        </div>
        <div className="col-span-2">
          <h4 className="font-semibold">Address</h4>
          <p>{claim.address}</p>
        </div>
        <div>
          <h4 className="font-semibold">Incident Date</h4>
          <p>{formatDate(claim.incident_date || claim.incidentDate)}</p>
        </div>
        <div>
          <h4 className="font-semibold">Incident Location</h4>
          <p>{claim.incident_location || claim.incidentLocation}</p>
        </div>
        <div>
          <h4 className="font-semibold">Claim Type</h4>
          <p className="capitalize">{claim.claim_type || claim.claimType || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold">Claim Amount</h4>
          <p>{formatAmount(claim.claim_amount || claim.claimAmount)}</p>
        </div>
        <div className="col-span-2">
          <h4 className="font-semibold">Description</h4>
          <p>{claim.description}</p>
        </div>
        {claim.supportingDocuments && claim.supportingDocuments.length > 0 && (
          <div className="col-span-2">
            <h4 className="font-semibold">Supporting Documents</h4>
            <ul className="list-disc list-inside">
              {claim.supportingDocuments.map((doc, index) => (
                <li key={index}>{doc.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <DialogFooter>
        {claim.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClaim(claim);
                setIsRejectDialogOpen(true);
              }}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                setSelectedClaim(claim);
                handleApprovalRequest(claim.id);
              }}
            >
              Approve
            </Button>
          </div>
        )}
      </DialogFooter>
    </DialogContent>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Claims Management</h1>
        <div className="space-x-4">
          <Button 
            variant="outline" 
            onClick={fetchClaims}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/claims/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </div>
      </div>
      <ClaimsSummary claims={claims} />
      <Card className="p-6">
        <div className="flex justify-between mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-[180px]"
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-[180px]"
              />
            </div>
          </div>
          <Button onClick={exportToCsv}>
            Export to CSV
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Press '/' to search • 'Esc' to clear • '←/→' for pagination • 'Ctrl+E' to export
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => toggleSort('claimant_name')} className="cursor-pointer">
                Claimant {sortField === 'claimant_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead onClick={() => toggleSort('claim_type')} className="cursor-pointer">
                Type {sortField === 'claim_type' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead onClick={() => toggleSort('claim_amount')} className="cursor-pointer">
                Amount {sortField === 'claim_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead onClick={() => toggleSort('submitted_at')} className="cursor-pointer">
                Submitted Date {sortField === 'submitted_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead onClick={() => toggleSort('status')} className="cursor-pointer">
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24">
                  <div className="flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-2 text-sm text-gray-500">Loading claims...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-lg font-medium">No claims found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>{claim.claimant_name || claim.claimantName || 'N/A'}</TableCell>
                  <TableCell className="capitalize">{claim.claim_type || claim.claimType || 'N/A'}</TableCell>
                  <TableCell>{formatAmount(claim.claim_amount || claim.claimAmount)}</TableCell>
                  <TableCell>{formatDate(claim.submitted_at)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(claim.status || 'pending')}>
                      {claim.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <ClaimDetailsDialog claim={claim} />
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min(sortedClaims.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
            {Math.min(sortedClaims.length, currentPage * itemsPerPage)} of{' '}
            {sortedClaims.length} claims
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this claim? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedClaim && handleStatusUpdate(selectedClaim.id, 'approved')}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Approval OTP</DialogTitle>
            <DialogDescription>
              Please enter the OTP sent to verify claim approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 6-digit OTP"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOtpDialogOpen(false);
                setOtpInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedClaim && handleOTPVerification(selectedClaim.id)}
            >
              Verify & Approve
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
