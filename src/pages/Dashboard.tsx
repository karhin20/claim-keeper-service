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
} from "lucide-react";
import { useEffect, useState } from 'react';
import { claimsApi } from '../services/api/claims';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import Spinner from "@/components/ui/spinner";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500 hover:bg-green-600';
    case 'rejected':
      return 'bg-red-500 hover:bg-red-600';
    case 'reviewing':
      return 'bg-yellow-500 hover:bg-yellow-600';
    default:
      return 'bg-blue-500 hover:bg-blue-600';
  }
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!session) {
          navigate('/login');
          return;
        }

        const [statsData, recentData] = await Promise.all([
          claimsApi.getStats(),
          claimsApi.getRecentActivity()
        ]);

        if (!statsData || !recentData) {
          throw new Error('Failed to load dashboard data');
        }

        setStats(statsData);
        setRecentActivity(recentData);
      } catch (error) {
        console.error('Dashboard data loading error:', error);
        setError(error.message || 'Failed to load dashboard data');
        if (error.message?.includes('Authentication required')) {
          navigate('/login');
        } else {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate, session]);

  if (!session) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats || !recentActivity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard data'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
          </div>
          <Button onClick={() => navigate("/claims/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Claims"
            value={stats.total.toString()}
            icon={ClipboardList}
          />
          <DashboardCard
            title="Pending Claims"
            value={stats.pending.toString()}
            icon={Clock}
          />
          <DashboardCard
            title="Approved Claims"
            value={stats.approved.toString()}
            icon={CheckCircle}
          />
          <DashboardCard
            title="Rejected Claims"
            value={stats.rejected.toString()}
            icon={XCircle}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 glass-card">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/claims")}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                View All Claims
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/employees")}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Employees
              </Button>
            </div>
          </Card>

          <Card className="p-6 glass-card">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity?.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{activity.claimant_name}</p>
                      <p className="text-sm text-gray-600">
                        {activity.claim_type} - ₵{activity.claim_amount.toFixed(2)}
                      </p>
                      <Badge className={`${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(activity.submitted_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No recent activity</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
