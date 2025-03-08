import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import Spinner from "@/components/ui/spinner";
import { authApi } from '@/services/api/auth';

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin',
    phone: '',
    registrationKey: ''
  });

  const [passwordFocus, setPasswordFocus] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.signUp(formData);
      toast({
        title: "Registration successful!",
        description: "Please check your email to confirm your registration.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Sign-up failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check password strength
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasLowerCase = /[a-z]/.test(formData.password);
  const hasNumbers = /\d/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
  const isLongEnough = formData.password.length >= 8;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-md p-8 glass-card animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-gray-600">Sign up to manage health claims</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              required
            />
            {passwordFocus && (
              <div className="text-xs space-y-1 mt-2 p-2 bg-gray-50 rounded border">
                <p className="font-medium">Password must have:</p>
                <p className={isLongEnough ? "text-green-600" : "text-gray-500"}>
                  ✓ At least 8 characters
                </p>
                <p className={hasUpperCase ? "text-green-600" : "text-gray-500"}>
                  ✓ At least one uppercase letter
                </p>
                <p className={hasLowerCase ? "text-green-600" : "text-gray-500"}>
                  ✓ At least one lowercase letter
                </p>
                <p className={hasNumbers ? "text-green-600" : "text-gray-500"}>
                  ✓ At least one number
                </p>
                <p className={hasSpecialChar ? "text-green-600" : "text-gray-500"}>
                  ✓ At least one special character
                </p>
              </div>
            )}
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
              type="text"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
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
          <Button 
            type="submit" 
            disabled={loading || !isLongEnough || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar}
          >
            {loading ? <Spinner /> : "Sign Up"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;