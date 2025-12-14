// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция для восстановления сессии из localStorage
  const restoreSession = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedTokens = {
        access: localStorage.getItem('access_token'),
        refresh: localStorage.getItem('refresh_token')
      };

      if (savedUser && savedTokens.access) {
        // Проверяем, не истек ли токен
        const userData = JSON.parse(savedUser);
        setUser({
          ...userData,
          tokens: savedTokens
        });

        // Пробуем получить свежие данные пользователя
        try {
          const userInfo = await apiService.getCurrentUser();
          if (userInfo.authenticated) {
            console.log('✅ Сессия восстановлена');
          } else {
            console.log('❌ Сессия устарела, требуется повторный вход');
            logout();
          }
        } catch (error) {
          console.log('⚠️ Не удалось проверить сессию, пробуем обновить токен');
          // Пробуем обновить токен
          if (savedTokens.refresh) {
            try {
              const newTokens = await apiService.refreshToken(savedTokens.refresh);
              login({
                ...userData,
                tokens: {
                  access: newTokens.access_token,
                  refresh: newTokens.refresh_token
                }
              });
            } catch (refreshError) {
              console.log('❌ Не удалось обновить токен');
              logout();
            }
          } else {
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Ошибка восстановления сессии:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Восстанавливаем сессию при загрузке
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

// frontend/src/context/AuthContext.jsx - ИСПРАВЬ МЕТОД login
const login = (userData) => {
  console.log('🔑 Вход пользователя в контексте:', userData);
  
  // Ожидаем такой формат userData:
  // {
  //   access_token: "...",
  //   refresh_token: "...",
  //   user_id: 1,
  //   username: "...",
  //   email: "..."
  // }
  
  const userInfo = {
    id: userData.user_id || userData.id,
    username: userData.username,
    email: userData.email
  };
  
  console.log('👤 Сохраняем пользователя:', userInfo);
  
  setUser(userInfo);

  // Сохраняем в localStorage
  localStorage.setItem('user', JSON.stringify(userInfo));
  
  if (userData.access_token) {
    localStorage.setItem('access_token', userData.access_token);
    apiService.setTokens(userData.access_token, userData.refresh_token || '');
    console.log('🔐 Токен access сохранен');
  }
  
  if (userData.refresh_token) {
    localStorage.setItem('refresh_token', userData.refresh_token);
    console.log('🔄 Токен refresh сохранен');
  }
};

  const logout = () => {
    console.log('🚪 Выход пользователя');
    
    setUser(null);
    
    // Очищаем localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Очищаем токены в apiService
    apiService.clearTokens();
    
    // Перенаправляем на страницу входа
    window.location.href = '/auth';
  };

  const updateTokens = (newTokens) => {
    if (user) {
      const updatedUser = {
        ...user,
        tokens: {
          access: newTokens.access_token,
          refresh: newTokens.refresh_token
        }
      };
      
      setUser(updatedUser);
      
      localStorage.setItem('access_token', newTokens.access_token);
      localStorage.setItem('refresh_token', newTokens.refresh_token);
      
      apiService.setTokens(newTokens.access_token, newTokens.refresh_token);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateTokens,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};