import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import Spinner from "@/components/ui/spinner";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: '',
    phone: '',
    registrationKey: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(formData);
      toast({
        title: "Success",
        description: "Account created successfully. Please check your email for verification.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-md p-8 glass-card animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-gray-600">Sign up to manage health claims</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="registrationKey">Registration Key</Label>
            <Input
              id="registrationKey"
              type="password"
              placeholder="Enter registration key"
              value={formData.registrationKey}
              onChange={(e) => setFormData({...formData, registrationKey: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              type="text"
              placeholder="Enter your role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-600">Already have an account?</span>
            <Button
              variant="link"
              className="text-primary hover:underline p-0"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignUp; 