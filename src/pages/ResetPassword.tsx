import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { authApi } from "@/services/api/auth";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword(token!, password);
      
      toast({
        title: "Success",
        description: "Password reset successfully. Please login with your new password.",
      });
      
      navigate("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-4">
            This password reset link is invalid or has expired.
            Please request a new password reset link.
          </p>
          <Button onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword; 