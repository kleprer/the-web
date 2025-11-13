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
      <div className="w-1/2 flex items-center justify-center p-8">
        <AuthForm
          isLogin={isLogin}
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onSwitchMode={handleSwitchMode}
        />
      </div>
    </div>
  );
};

export default Auth;