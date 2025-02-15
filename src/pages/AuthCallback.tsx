import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Spinner from '@/components/ui/spinner';
import { authApi } from '@/services/api/auth';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { session } = await authApi.getSession();
        
        if (session) {
          toast.success('Successfully signed in!');
          navigate('/claims', { replace: true });
        } else {
          throw new Error('No session found');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast.error('Failed to complete sign in');
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 