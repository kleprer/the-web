import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import SEOMeta from '../components/SEOMeta';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // если пользователь уже авторизован, перенаправляем на главную
  if (isAuthenticated) {
    navigate('/boards');
    return null;
  }

  const handleSwitchMode = (): void => {
    setIsLogin(!isLogin);
  };

  return (
    <>
      <SEOMeta
        title={isLogin ? 'вход в систему' : 'регистрация'}
        description="войдите в журналистский ассистент или создайте новый аккаунт для работы с расследованиями, таймлайнами и доказательствами"
        canonicalUrl="/auth"
        type="website"  // исправлено: ogType -> type
      />
      
      <div className="bg-[#151516] min-h-screen">
        <Navbar />
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
              alt="иллюстрация журналистского расследования"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;