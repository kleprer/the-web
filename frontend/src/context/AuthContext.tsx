import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { apiService } from '../services/api';
import { User, UserWithTokens } from '../types/index';
import { AuthContextType } from '../types/context';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Функция для восстановления сессии из localStorage
  const restoreSession = useCallback(async (): Promise<void> => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedAccessToken = localStorage.getItem('access_token');
      const savedRefreshToken = localStorage.getItem('refresh_token');

      if (savedUser && savedAccessToken) {
        // Проверяем, не истек ли токен
        const userData = JSON.parse(savedUser) as User;
        setUser(userData);

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
          if (savedRefreshToken) {
            try {
              // ИСПРАВЛЕНО: правильно вызываем refreshToken
              const newTokens = await apiService.refreshAccessToken(savedRefreshToken);
              // ИСПРАВЛЕНО: не используем tokens
              login({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token
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

  const login = (userData: UserWithTokens): void => {
    console.log('🔑 Вход пользователя в контексте:', userData);
    
    const userInfo: User = {
      id: userData.user_id || userData.id || 0,
      username: userData.username || '',
      email: userData.email || ''
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

  const logout = (): void => {
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

  const updateTokens = (newTokens: { access_token: string; refresh_token: string }): void => {
    if (user) {
      // ИСПРАВЛЕНО: передаем как отдельные поля
      login({
        id: user.id,
        username: user.username,
        email: user.email,
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token
      });
    }
  };

  const value: AuthContextType = {
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