// pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import Navbar from '../components/Navbar';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    login: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Логика авторизации/регистрации
    console.log(isLogin ? 'Login attempt:' : 'Register attempt:', formData);
    navigate('/boards');
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', username: '', password: '', login: '' });
  };

  return (
    <div className="bg-[#151516]">
      <Navbar />
      {/* Левая половина - форма */}
      <div className="flex items-end justify-end absolute inset-0 gap-[10rem]">
        <div className="flex-1 flex justify-center pb-[14rem] pl-[15rem] w-full">
          <AuthForm
            isLogin={isLogin}
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
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