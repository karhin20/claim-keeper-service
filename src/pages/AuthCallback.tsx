import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api/auth';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const session = await authApi.checkSession();
        if (session) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin">Authenticating...</div>
    </div>
  );
};

export default AuthCallback; 