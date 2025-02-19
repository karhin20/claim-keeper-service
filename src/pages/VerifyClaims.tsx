import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { claimsApi } from "@/services/api/claims";
import { toast } from "sonner";

export default function VerifyClaims() {
  const [id, setId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await claimsApi.verifyApprovalOTP(id, otp);
      toast.success("Claim verified successfully");
      setId("");
      setOtp("");
    } catch (error) {
      toast.error(error.message || "Failed to verify claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Verify Claim Payment</h2>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label htmlFor="id">Claim ID</Label>
            <Input
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter claim ID"
              required
            />
          </div>
          <div>
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter verification code"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify Claim"}
          </Button>
        </form>
      </Card>
    </div>
  );
} 