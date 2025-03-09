import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add any necessary cleanup logic here
  }, [navigate]);

  return (
    <div className="flex flex-col h-full">
      {/* Rest of the component content */}
      <Link 
        to="/claims" 
        className={...}
        onClick={(e) => {
          e.preventDefault();
          navigate('/claims');
        }}
      >
        <ClipboardList />
        Claims
      </Link>
    </div>
  );
};

export default Sidebar; 