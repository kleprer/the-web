// components/AuthForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from './InputField';
import ButtonFilled from './ButtonFilled';
import ButtonOutline from './ButtonOutline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext'; // Измененный импорт!

const AuthForm = ({ isLogin, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    login: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Используем контекст

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

// frontend/src/components/AuthForm.jsx - ИСПРАВЬ ОБРАБОТКУ ОТВЕТА
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    console.log('📤 Отправка данных:', formData);
    
    let response;
    
    if (isLogin) {
      // 🔴 ВАЖНО: используем правильные поля для логина
      response = await apiService.login({
        username: formData.login,  // Поле называется login
        password: formData.password
      });
    } else {
      response = await apiService.signup({
        username: formData.username,
        password: formData.password,
        email: formData.email
      });
    }

    console.log('📥 Ответ от сервера:', response);

    // 🔴 ПРОБЛЕМА БЫЛА ЗДЕСЬ: login ожидает тот же объект, что вернул сервер
    login(response);  // Передаем ВЕСЬ объект response
    
    console.log('✅ Успешная авторизация, переход к /boards');
    navigate('/boards');
    
  } catch (err) {
    console.error('❌ Ошибка авторизации:', err);
    setError(err.message || 'Произошла ошибка');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="border border-white border-opacity-50 rounded-[20px] bg-transparent p-8 w-[30rem]">
      <h2 className="text-2xl font-semibold text-white text-center mb-8">
        {isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
      </h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Поле email только для регистрации */}
        {!isLogin && (
          <div>
            <label className="text-white text-sm mb-2 block">Почта</label>
            <InputField
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Введите вашу почту"
              className="w-full"
              required
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
            onChange={(e) => handleInputChange(isLogin ? 'login' : 'username', e.target.value)}
            placeholder={isLogin ? 'Введите ваш логин' : 'Придумайте логин'}
            className="w-full"
            required
          />
        </div>

        {/* Поле пароль */}
        <div>
          <label className="text-white text-sm mb-2 block">Пароль</label>
          <InputField
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder={isLogin ? 'Введите ваш пароль' : 'Придумайте пароль'}
            className="w-full"
            required
            minLength="3"
          />
        </div>

        {/* Основная кнопка */}
        <ButtonFilled
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
        </ButtonFilled>

        {/* Кнопка переключения */}
        <div className="text-center">
          <ButtonOutline
            type="button"
            onClick={onSwitchMode}
            className="w-full"
            disabled={loading}
          >
            {isLogin ? 'Зарегистрироваться' : 'Есть аккаунт'}
          </ButtonOutline>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;