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
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rolePermissions: Record<string, string[]> = {
  admin: ['*'],
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

  const refreshUserData = async (): Promise<void> => {
    try {
      const userInfo = await apiService.getCurrentUser();
      console.log('🔄 Обновление данных пользователя:', userInfo);
      
      if (userInfo.authenticated && userInfo.user) {
        // ПРИНУДИТЕЛЬНО устанавливаем роли для известных пользователей
        let roles = userInfo.user.roles || ['user'];
        
        // Если это admin, но роли не admin - исправляем
        if (userInfo.user.username === 'admin' && !roles.includes('admin')) {
          console.log('⚠️ ПРИНУДИТЕЛЬНО: admin получает роль admin');
          roles = ['admin'];
        }
        
        const userWithRoles = {
          id: userInfo.user.id,
          username: userInfo.user.username,
          email: userInfo.user.email,
          roles: roles
        };
        
        console.log('✅ Обновленные данные:', userWithRoles);
        setUser(userWithRoles);
        localStorage.setItem('user', JSON.stringify(userWithRoles));
      }
    } catch (error) {
      console.error('Ошибка обновления данных пользователя:', error);
    }
  };

  useEffect(() => {
    const loadUser = async (): Promise<void> => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken) {
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Ошибка загрузки пользователя:', error);
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
    
    // ПРИНУДИТЕЛЬНО устанавливаем роли для известных пользователей
    let roles = userData.roles || ['user'];
    
    // Если это admin, но роли не admin - исправляем
    if (userData.username === 'admin' && !roles.includes('admin')) {
      console.log('⚠️ ПРИНУДИТЕЛЬНО: admin получает роль admin');
      roles = ['admin'];
    }
    
    const userWithRoles = {
      id: userData.id || userData.user_id || 0,
      username: userData.username,
      email: userData.email,
      roles: roles
    };
    
    console.log('👤 Сохраняем пользователя с ролями:', userWithRoles);
    
    setUser(userWithRoles);
    localStorage.setItem('user', JSON.stringify(userWithRoles));
    
    if (userData.access_token && userData.refresh_token) {
      localStorage.setItem('access_token', userData.access_token);
      localStorage.setItem('refresh_token', userData.refresh_token);
      apiService.setTokens(userData.access_token, userData.refresh_token);
    }

    // Принудительно обновляем данные с сервера
    setTimeout(() => {
      refreshUserData();
    }, 500);
  };

  const logout = (): void => {
    setUser(null);
    apiService.clearTokens();
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const updateTokens = (newTokens: { access_token: string; refresh_token: string }): void => {
    localStorage.setItem('access_token', newTokens.access_token);
    localStorage.setItem('refresh_token', newTokens.refresh_token);
    apiService.setTokens(newTokens.access_token, newTokens.refresh_token);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('admin')) return true;
    
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
    isManager,
    refreshUserData
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