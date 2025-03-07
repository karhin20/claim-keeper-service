import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimsApi } from '@/services/api/claims';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ClaimData } from '@/types/claim';

export function ClaimForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClaimData>({
    claimant_name: '',
    claimant_id: '',
    email: '',
    phone: '',
    address: '',
    incident_date: '',
    incident_location: '',
    claim_type: 'medical',
    claim_amount: 0,
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'claim_amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting claim form with data:', formData);
    
    try {
      setIsSubmitting(true);
      
      // Add visual feedback during submission
      toast.loading('Submitting your claim...');
      
      const response = await claimsApi.createClaim(formData);
      
      console.log('Claim submission response:', response);
      
      toast.dismiss();
      toast.success('Claim submitted successfully!');
      
      // Navigate to the claims list page
      navigate('/claims');
    } catch (error) {
      console.error('Claim submission error:', error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Submit New Claim</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="claimant_name" className="text-sm font-medium">Full Name</label>
            <Input
              id="claimant_name"
              name="claimant_name"
              value={formData.claimant_name}
              onChange={handleChange}
              required
            />
          </div>
          
          {/* Add all your other form fields here */}
          
          <div className="col-span-2 space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/claims')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Claim'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
} 