import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Users,
  PlusCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  BarChart3,
  PieChart,
  DollarSign,
} from "lucide-react";
import { useEffect, useState, useCallback } from 'react';
import { claimsApi } from '../services/api/claims';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import Spinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClaimStats {
  total: number;
  pending: number;
  reviewing: number;
  approved: number;
  confirmed: number;
  rejected: number;
  paid: number;
  totalAmount: number;
}

interface RecentClaim {
  id: string;
  claimant_name: string;
  claim_type: string;
  claim_amount: number;
  status: string;
  submitted_at: string;
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

const formatAmount = (amount: number) => {
  return `₵${amount.toFixed(2)}`;
};

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: any;
  trend?: string;
}) => (
  <Card className="p-6 glass-card hover-lift">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        {trend && <p className="text-sm text-green-600 mt-1">{trend}</p>}
      </div>
      <Icon className="h-8 w-8 text-primary" />
    </div>
  </Card>
);

const RecentActivity = ({ claims }: { claims: RecentClaim[] }) => {
  const navigate = useNavigate();
  
  const handleClaimClick = (id: string) => {
    navigate(`/claims?id=${id}`);
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Claimant</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claims.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              No recent claims found
            </TableCell>
          </TableRow>
        ) : (
          claims.map((claim) => (
            <TableRow 
              key={claim.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleClaimClick(claim.id)}
            >
              <TableCell>{claim.claimant_name}</TableCell>
              <TableCell>{claim.claim_type}</TableCell>
              <TableCell>{formatAmount(claim.claim_amount)}</TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(claim.status)}`}>
                  {claim.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(claim.submitted_at), 'MMM d, yyyy')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

const SimpleBarChart = ({ data }: { data: any[] }) => (
  <div className="flex h-64 items-end space-x-2">
    {data.map((item, index) => (
      <div key={index} className="flex flex-col items-center">
        <div 
          className="bg-blue-500 w-12 rounded-t-md" 
          style={{ height: `${(item.amount / Math.max(...data.map(d => d.amount))) * 200}px` }}
        ></div>
        <span className="text-xs mt-2">{item.name}</span>
      </div>
    ))}
  </div>
);

const SimplePieChart = ({ data }: { data: any[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full mr-2" 
            style={{ backgroundColor: item.color }}
          ></div>
          <span className="text-sm">
            {item.name}: {item.value} ({Math.round((item.value / total) * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<ClaimStats>({
    total: 0,
    pending: 0,
    reviewing: 0,
    approved: 0,
    confirmed: 0,
    rejected: 0,
    paid: 0,
    totalAmount: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { session } = useAuth();

  // Add state for chart data
  const [statusChartData, setStatusChartData] = useState<any[]>([]);
  const [amountChartData, setAmountChartData] = useState<any[]>([]);

  // Memoize the fetchData function to prevent infinite loops
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statsData, recentData] = await Promise.all([
        claimsApi.getStats(),
        claimsApi.getRecentActivity()
      ]);
      
      setStats(statsData);
      setRecentActivity(recentData);
      
      // Prepare data for status chart
      const statusData = [
        { name: 'Pending', value: statsData.pending, color: '#3b82f6' },
        { name: 'Reviewing', value: statsData.reviewing, color: '#eab308' },
        { name: 'Approved', value: statsData.approved, color: '#3b82f6' },
        { name: 'Confirmed', value: statsData.confirmed, color: '#22c55e' },
        { name: 'Rejected', value: statsData.rejected, color: '#ef4444' },
        { name: 'Paid', value: statsData.paid || 0, color: '#10b981' }
      ];
      setStatusChartData(statusData);
      
      // Prepare data for amount chart (we'll use recent activity for this)
      const amountData = recentData.map(claim => ({
        name: claim.claimant_name.split(' ')[0], // Just use first name for brevity
        amount: claim.claim_amount
      }));
      setAmountChartData(amountData);
      
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please log in to view the dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Total Claims</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Pending</span>
            <span className="text-2xl font-bold text-blue-600">{stats.pending}</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Reviewing</span>
            <span className="text-2xl font-bold text-yellow-600">{stats.reviewing}</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Approved</span>
            <span className="text-2xl font-bold text-blue-600">{stats.approved}</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Confirmed</span>
            <span className="text-2xl font-bold text-green-600">{stats.confirmed}</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Rejected</span>
            <span className="text-2xl font-bold text-red-600">{stats.rejected}</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Total Amount</span>
            <span className="text-2xl font-bold">
              ₵{(stats.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Claims by Status</h2>
          <div className="h-64">
            <SimplePieChart data={statusChartData} />
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Recent Claim Amounts</h2>
          <div className="h-64">
            <SimpleBarChart data={amountChartData} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <RecentActivity claims={recentActivity} />
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={() => navigate('/claims')}>
              View All Claims
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="w-full flex items-center justify-center gap-2 py-6"
                onClick={() => navigate('/new-claim')}
              >
                <PlusCircle className="h-5 w-5" />
                <span>Create New Claim</span>
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/claims?status=pending')}
                  className="flex flex-col items-center justify-center py-6 h-full"
                >
                  <Clock className="h-5 w-5 mb-2" />
                  <span>View Pending Claims</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/claims?status=approved')}
                  className="flex flex-col items-center justify-center py-6 h-full"
                >
                  <CheckCircle className="h-5 w-5 mb-2" />
                  <span>View Approved Claims</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/claims?status=confirmed')}
                  className="flex flex-col items-center justify-center py-6 h-full"
                >
                  <DollarSign className="h-5 w-5 mb-2" />
                  <span>Process Payments</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/claims')}
                  className="flex flex-col items-center justify-center py-6 h-full"
                >
                  <ClipboardList className="h-5 w-5 mb-2" />
                  <span>View All Claims</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
