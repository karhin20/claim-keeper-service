import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Spinner from "@/components/ui/spinner";
import { authApi } from '@/services/api/auth';

const MagicLink = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.signInWithMagicLink(email);
      setSent(true);
      toast.success('Check your email for the magic link!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center p-4">
        <h3 className="text-lg font-medium mb-2">Check your email</h3>
        <p className="text-gray-600 mb-4">
          We've sent a magic link to {email}
        </p>
        <Button
          variant="outline"
          onClick={() => setSent(false)}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            <span>Sending...</span>
          </div>
        ) : (
          "Send Magic Link"
        )}
      </Button>
    </form>
  );
};

export default MagicLink; 