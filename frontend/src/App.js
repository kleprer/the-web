import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import BoardSelection from './pages/BoardSelection';
import InvestigationBoard from './pages/InvestigationBoard';
import Timeline from './pages/Timeline';
import EvidenceStorage from './pages/EvidenceStorage';
import './App.css';

// Контекст для хранения пользователя
export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненного пользователя при загрузке
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  };

  if (loading) {
    return <div className="min-h-screen bg-[#151516] flex items-center justify-center">
      <div className="text-white">Загрузка...</div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="App bg-[#151516] min-h-screen">
          <Routes>
            {/* Авторизация */}
            <Route 
              path="/auth" 
              element={!user ? <Auth /> : <Navigate to="/boards" replace />} 
            />
            
            {/* Защищенные маршруты */}
            <Route 
              path="/boards" 
              element={user ? <BoardSelection /> : <Navigate to="/auth" replace />} 
            />
            
            <Route 
              path="/board/:boardId" 
              element={user ? <InvestigationBoard /> : <Navigate to="/auth" replace />} 
            />
            
            <Route 
              path="/timeline/:boardId" 
              element={user ? <Timeline /> : <Navigate to="/auth" replace />} 
            />
            
            <Route 
              path="/evidence/:boardId" 
              element={user ? <EvidenceStorage /> : <Navigate to="/auth" replace />} 
            />
            
            {/* Перенаправление */}
            <Route 
              path="/" 
              element={<Navigate to={user ? "/boards" : "/auth"} replace />} 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;