// components/Navbar.jsx
import React from 'react';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Импортируем хук

const Navbar = ({ currentBoardName = "Текущая доска", boards = [] }) => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Используем контекст

  const handleLogout = () => {
    logout(); // Используем функцию из контекста
    navigate('/auth'); // Переходим на страницу авторизации
  };

  return (
    <nav className="bg-[#151516] p-4 relative z-50 border-b border-gray-700">
      <div className="bg-[#151516] max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {user && ( // Показываем только если пользователь авторизован
            <UserDropdown 
              userData={user}
              onLogout={handleLogout}
            />
          )}
          
          {/* Название текущей доски с выпадающим списком */}
          {boardId && (
            <BoardDropdown 
              currentBoardName={currentBoardName} 
              boards={boards}
              currentBoardId={boardId}
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/timeline" className="flex flex-row items-end hover:opacity-80 transition-opacity">
            <p className="font-comorant-sc font-semibold text-2xl text-white leading-none">
              
            </p>
            <p className="font-inter font-light text-sm text-white leading-none mt-1">
              таймлайны
            </p>
          </Link>
          <Link to="/evidences" className="flex flex-row items-end hover:opacity-80 transition-opacity">
            <p className="font-comorant-sc font-semibold text-2xl text-white leading-none">
              
            </p>
            <p className="font-inter font-light text-sm text-white leading-none mt-1">
              доказательства
            </p>
          </Link>
          <Link to="/boards" className="flex flex-row items-end hover:opacity-80 transition-opacity">
            <p className="font-comorant-sc font-semibold text-2xl text-white leading-none">
              
            </p>
            <p className="font-inter font-light text-sm text-white leading-none mt-1">
              доски
            </p>
          </Link>
          <Link to="/boards" className="flex flex-col items-end hover:opacity-80 transition-opacity">
            <p className="font-comorant-sc font-semibold text-2xl text-white leading-none">
              ПАУТИНА
            </p>
            <p className="font-inter font-light text-sm text-white leading-none mt-1">
              ассистент журналиста
            </p>
          </Link>
          <Link to="/boards">
            <img 
              src="/logo.svg" 
              alt="Логотип" 
              className="h-10 w-10 hover:opacity-80 transition-opacity cursor-pointer" 
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};

// Компонент выпадающего меню пользователя
const UserDropdown = ({ userData, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      {/* Иконка пользователя */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
        onMouseEnter={() => setIsOpen(true)}
      >
        <UserOutlined className="text-black text-lg text-[24px]" />
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-4">
            {/* Заголовок */}
            <div className="text-sm text-gray-400 mb-2">
              Аккаунт
            </div>
            
            {/* Информация о пользователе */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">Логин:</span>
                <span className="text-white text-sm">{userData.username}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">Email:</span>
                <span className="text-white text-sm truncate">{userData.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">ID:</span>
                <span className="text-gray-400 text-xs">{userData.id}</span>
              </div>
            </div>

            {/* Разделитель */}
            <div className="border-t border-gray-700 my-3"></div>

            {/* Кнопка выхода */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
            >
              <LogoutOutlined />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент выпадающего списка досок (остается без изменений)
const BoardDropdown = ({ currentBoardName, boards, currentBoardId }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Mock данные для досок (можно заменить на реальные)
  const mockBoards = [
    { id: '1', name: 'Расследование коррупции', description: 'Основное расследование' },
    { id: '2', name: 'Финансовые схемы', description: 'Анализ финансовых потоков' },
    { id: '3', name: 'Политические связи', description: 'Связи между политиками' },
    { id: '4', name: 'Бизнес-структуры', description: 'Анализ компаний' },
  ];

  const availableBoards = boards.length > 0 ? boards : mockBoards;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white text-sm font-medium"
      >
        <span className="max-w-40 truncate">{currentBoardName}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700">
              Ваши доски
            </div>
            
            {availableBoards.map((board) => (
              <Link
                key={board.id}
                to={`/board/${board.id}`}
                className={`block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors ${
                  board.id === currentBoardId ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium text-white text-sm">
                  {board.name}
                </div>
                {board.description && (
                  <div className="text-xs text-gray-400 mt-1">
                    {board.description}
                  </div>
                )}
              </Link>
            ))}

            <div className="border-t border-gray-700 mt-2 pt-2">
              <Link
                to="/boards"
                className="block px-3 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium text-center"
                onClick={() => setIsOpen(false)}
              >
                Управление всеми досками →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Overlay для закрытия при клике вне */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Navbar;