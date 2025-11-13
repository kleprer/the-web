import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import BoardSelection from './pages/BoardSelection';
import InvestigationBoard from './pages/InvestigationBoard';
import Timeline from './pages/Timeline';
import EvidenceStorage from './pages/EvidenceStorage';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App bg-[#151516] min-h-screen">
        <Navbar />
        <Routes>
          {/* Авторизация */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Выбор доски */}
          <Route path="/boards" element={<BoardSelection />} />
          
          {/* Доска расследования */}
          <Route path="/board/:boardId" element={<InvestigationBoard />} />
          
          {/* Таймлайн */}
          <Route path="/timeline/:boardId" element={<Timeline />} />
          
          {/* Хранилище доказательств */}
          <Route path="/evidence/:boardId" element={<EvidenceStorage />} />
          
          {/* Перенаправление с корня на авторизацию */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          
          {/* Запасной маршрут для несуществующих страниц */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;