import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authApi } from '@/services/api/auth';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword(email);
      setSent(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-md p-8 glass-card animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-gray-600">
            {sent 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive reset instructions"}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Button
            variant="link"
            className="text-primary hover:underline"
            onClick={() => window.history.back()}
          >
            Back to Login
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword; 