import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext'; 

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Если пользователь уже авторизован, перенаправляем на главную
  if (isAuthenticated) {
    navigate('/boards');
    return null;
  }

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="bg-[#151516] min-h-screen">
      <Navbar />
      {/* Левая половина - форма */}
      <div className="flex items-end justify-end absolute inset-0 gap-[10rem]">
        <div className="flex-1 flex justify-center pb-[14rem] pl-[15rem] w-full">
          <AuthForm
            isLogin={isLogin}
            onSwitchMode={handleSwitchMode}
          />
        </div>
        <div className="h-[45rem]">
          <img 
            src="/art.svg" 
            alt="Art"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;