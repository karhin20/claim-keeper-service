
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-4xl px-4 py-8 space-y-8 animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            Welcome to Health Claims Management
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Streamline Your Health Claims Process
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Efficiently manage employee health claims with our secure and intuitive platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="p-6 glass-card hover-lift">
            <h3 className="text-xl font-semibold mb-2">Staff Portal</h3>
            <p className="text-gray-600 mb-4">
              Access the claims management system to process and track employee health claims.
            </p>
            <Button
              className="w-full group"
              onClick={() => navigate("/login")}
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>

          <Card className="p-6 glass-card hover-lift">
            <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Contact your administrator for account access and support.
            </p>
            <Button
              variant="outline"
              className="w-full group"
              onClick={() => navigate("/contact")}
            >
              Contact Support
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
