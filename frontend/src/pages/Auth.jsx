import React from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/boards');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151516]">
    </div>
  );
};

export default Auth;