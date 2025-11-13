// components/AuthForm.jsx
import React from 'react';
import InputField from './InputField';
import ButtonFilled from './ButtonFilled';
import ButtonOutline from './ButtonOutline';

const AuthForm = ({ 
  isLogin, 
  formData, 
  onInputChange, 
  onSubmit, 
  onSwitchMode 
}) => {
  return (
    <div className="border border-white border-opacity-50 rounded-[20px] bg-transparent p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-white text-center mb-8">
        {isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Поле email только для регистрации */}
        {!isLogin && (
          <div>
            <label className="text-white text-sm mb-2 block">Почта</label>
            <InputField
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="Введите вашу почту"
              className="w-full"
            />
          </div>
        )}

        {/* Поле логин/username */}
        <div>
          <label className="text-white text-sm mb-2 block">
            {isLogin ? 'Логин' : 'Логин'}
          </label>
          <InputField
            value={isLogin ? formData.login : formData.username}
            onChange={(e) => onInputChange(isLogin ? 'login' : 'username', e.target.value)}
            placeholder={isLogin ? 'Введите ваш логин' : 'Придумайте логин'}
            className="w-full"
          />
        </div>

        {/* Поле пароль */}
        <div>
          <label className="text-white text-sm mb-2 block">Пароль</label>
          <InputField
            type="password"
            value={formData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            placeholder={isLogin ? 'Введите ваш пароль' : 'Придумайте пароль'}
            className="w-full"
          />
        </div>

        {/* Основная кнопка */}
        <ButtonFilled
          type="submit"
          className="w-full"
        >
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </ButtonFilled>

        {/* Кнопка переключения */}
        <div className="text-center">
          <ButtonOutline
            type="button"
            onClick={onSwitchMode}
            className="w-full"
          >
            {isLogin ? 'Зарегистрироваться' : 'Есть аккаунт'}
          </ButtonOutline>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;