import React from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import ButtonOutline from '../components/ButtonOutline';
import ButtonFilled from '../components/ButtonFilled';
import CaseCard from '../components/CaseCard';

const Auth = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/boards');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151516]">
        <InputField placeholder="journalist@gmail.com"/>
        <ButtonOutline children="Войти" />
        <ButtonFilled children="Зарегистрироваться" />

    </div>
  );
};

export default Auth;