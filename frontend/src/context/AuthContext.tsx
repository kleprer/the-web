import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserWithTokens } from '../types/index';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: UserWithTokens) => void;
  logout: () => void;
  updateTokens: (newTokens: { access_token: string; refresh_token: string }) => void;
  isAuthenticated: boolean;
  // Методы для RBAC
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Определяем права для каждой роли
const rolePermissions: Record<string, string[]> = {
  admin: ['*'], // все права
  manager: [
    'create:investigation', 'read:any_investigation', 'update:any_investigation',
    'create:timeline', 'update:timeline', 'delete:own_timeline',
    'upload:file', 'download:file', 'delete:own_file',
    'manage:users'
  ],
  user: [
    'create:investigation', 'read:own_investigation', 'update:own_investigation',
    'create:timeline', 'update:own_timeline', 'delete:own_timeline',
    'upload:file', 'download:own_file', 'delete:own_file'
  ]
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Загрузка пользователя при старте
  useEffect(() => {
    const loadUser = async (): Promise<void> => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken) {
        try {
          // Пробуем получить актуальные данные с сервера
          const userInfo = await apiService.getCurrentUser();
          if (userInfo.authenticated && userInfo.user) {
            const userWithRoles = {
              id: userInfo.user.id,
              username: userInfo.user.username,
              email: userInfo.user.email,
              roles: userInfo.user.roles || ['user']
            };
            setUser(userWithRoles);
            localStorage.setItem('user', JSON.stringify(userWithRoles));
          } else {
            // Если не получилось, пробуем из localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
              } catch (e) {
                console.error('Ошибка парсинга пользователя:', e);
                localStorage.removeItem('user');
              }
            }
          }
        } catch (error) {
          console.error('Ошибка загрузки пользователя:', error);
          // В случае ошибки пробуем из localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (e) {
              console.error('Ошибка парсинга пользователя:', e);
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (userData: UserWithTokens): void => {
    console.log('🔐 AuthContext.login получены данные:', userData);
    
    // Создаем объект пользователя с ролями
    const userWithRoles = {
      id: userData.id || userData.user_id || 0,
      username: userData.username,
      email: userData.email,
      roles: userData.roles || ['user'] // Берем роли из ответа или ставим user по умолчанию
    };
    
    console.log('👤 Сохраняем пользователя с ролями:', userWithRoles);
    
    setUser(userWithRoles);
    localStorage.setItem('user', JSON.stringify(userWithRoles));
    
    if (userData.access_token && userData.refresh_token) {
      apiService.setTokens(userData.access_token, userData.refresh_token);
    }
  };

  const logout = (): void => {
    setUser(null);
    apiService.clearTokens();
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const updateTokens = (newTokens: { access_token: string; refresh_token: string }): void => {
    apiService.setTokens(newTokens.access_token, newTokens.refresh_token);
  };

  // Методы для проверки прав
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.roles) return false;
    
    // Админ имеет все права
    if (user.roles.includes('admin')) return true;
    
    // Проверяем по всем ролям пользователя
    for (const role of user.roles) {
      const permissions = rolePermissions[role] || [];
      if (permissions.includes('*') || permissions.includes(permission)) {
        return true;
      }
    }
    
    return false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return roles.some(role => user.roles?.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return roles.every(role => user.roles?.includes(role));
  };

  const isAdmin = (): boolean => {
    return user?.roles?.includes('admin') || false;
  };

  const isManager = (): boolean => {
    return user?.roles?.includes('manager') || user?.roles?.includes('admin') || false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateTokens,
    isAuthenticated: !!user,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isManager
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};