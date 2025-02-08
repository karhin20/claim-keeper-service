
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome back, Admin</p>
          </div>
          <Button onClick={() => navigate("/claims/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Claims"
            value="156"
            icon={ClipboardList}
            trend="+12% this month"
          />
          <DashboardCard
            title="Pending Claims"
            value="23"
            icon={Clock}
          />
          <DashboardCard
            title="Approved Claims"
            value="89"
            icon={CheckCircle}
          />
          <DashboardCard
            title="Rejected Claims"
            value="44"
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
              {/* We'll implement this with real data later */}
              <p className="text-gray-600">No recent activity</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
