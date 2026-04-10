import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import BoardSelection from './pages/BoardSelection';
import InvestigationBoard from './pages/InvestigationBoard';
import Timeline from './pages/Timeline';
import EvidenceStorage from './pages/EvidenceStorage';
import AdminPanel from './pages/AdminPanel';
import { WithRole } from './components/WithPermission';
import { HelmetProvider } from 'react-helmet-async';
import './App.css'

// Компонент для перенаправления
const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Проверяем токены при загрузке
  useEffect(() => {
    const checkTokens = (): void => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const user = localStorage.getItem('user');
      
      console.log('🔍 Проверка токенов при загрузке:');
      console.log('   access_token:', accessToken ? 'есть' : 'нет');
      console.log('   refresh_token:', refreshToken ? 'есть' : 'нет');
      console.log('   user:', user ? 'есть' : 'нет');
    };
    
    checkTokens();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#151516] flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Авторизация */}
      <Route 
        path="/auth" 
        element={!isAuthenticated ? <Auth /> : <Navigate to="/boards" replace />} 
      />
      
      {/* Защищенные маршруты */}
      <Route 
        path="/boards" 
        element={isAuthenticated ? <BoardSelection /> : <Navigate to="/auth" replace />} 
      />
      
      <Route 
        path="/board/:boardId" 
        element={isAuthenticated ? <InvestigationBoard /> : <Navigate to="/auth" replace />} 
      />
      
      <Route 
        path="/timeline/:boardId" 
        element={isAuthenticated ? <Timeline /> : <Navigate to="/auth" replace />} 
      />
      
      <Route 
        path="/evidence/:boardId" 
        element={isAuthenticated ? <EvidenceStorage /> : <Navigate to="/auth" replace />} 
      />
      
      {/* Админские маршруты */}
      <Route 
        path="/admin" 
        element={
          isAuthenticated ? (
            <WithRole roles={['admin', 'manager']}>
              <AdminPanel />
            </WithRole>
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      <Route 
        path="/admin/users" 
        element={
          isAuthenticated ? (
            <WithRole roles={['admin', 'manager']}>
              <AdminPanel />
            </WithRole>
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      {/* Перенаправление */}
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/boards" : "/auth"} replace />} 
      />
      
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider> {/* добавьте эту обертку */}
      <AuthProvider>
        <Router>
          <div className="App bg-[#151516] min-h-screen">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
};


export default App;