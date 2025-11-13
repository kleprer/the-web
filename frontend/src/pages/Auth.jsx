import React from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/boards');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151516]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Авторизация</h1>
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Войти
        </button>
      </div>
    </div>
  );
};

export default Auth;