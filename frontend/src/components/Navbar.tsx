import React, { useState, useEffect, useCallback } from 'react';
import { UserOutlined, LogoutOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { NavbarProps, UserDropdownProps, BoardDropdownProps } from '../types/props';
import { Investigation } from '../types/index';

const Navbar: React.FC<NavbarProps> = ({ currentBoardName = "Текущая доска" }) => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isManager } = useAuth();
  const [userBoards, setUserBoards] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ОТЛАДКА
  console.log('🔍 Navbar - текущий пользователь:', user);
  console.log('🔍 Navbar - роли пользователя:', user?.roles);
  console.log('🔍 Navbar - isAdmin():', isAdmin());
  console.log('🔍 Navbar - isManager():', isManager());

  const loadUserBoards = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const boards = await apiService.getInvestigations(user.id);
      setUserBoards(boards);
    } catch (error) {
      console.error('Ошибка загрузки досок пользователя:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserBoards();
  }, [loadUserBoards]);

  const handleLogout = (): void => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-[#151516] p-4 relative z-50 border-b border-gray-700">
      <div className="bg-[#151516] max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {user && (
            <UserDropdown 
              userData={user}
              onLogout={handleLogout}
              isAdmin={isAdmin()}
              isManager={isManager()}
            />
          )}
          
          {boardId && (
            <BoardDropdown 
              currentBoardName={currentBoardName} 
              boards={userBoards}
              currentBoardId={boardId}
              loading={loading}
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Админ-панель - показываем если админ или менеджер */}
          {(isAdmin() || isManager()) && (
            <Link 
              to="/admin" 
              className="flex flex-row items-end hover:opacity-80 transition-opacity mr-2"
            >
              <SettingOutlined className="text-white text-xl mr-1" />
              <p className="font-inter font-light text-sm text-white leading-none mt-1">
                админ
              </p>
            </Link>
          )}

          {boardId && (
            <>
              <Link 
                to={`/timeline/${boardId}`} 
                className="flex flex-row items-end hover:opacity-80 transition-opacity"
              >
                <p className="font-comorant-sc font-semibold text-2xl text-white leading-none"></p>
                <p className="font-inter font-light text-sm text-white leading-none mt-1">
                  таймлайны
                </p>
              </Link>
              <Link 
                to={`/evidence/${boardId}`} 
                className="flex flex-row items-end hover:opacity-80 transition-opacity"
              >
                <p className="font-comorant-sc font-semibold text-2xl text-white leading-none"></p>
                <p className="font-inter font-light text-sm text-white leading-none mt-1">
                  доказательства
                </p>
              </Link>
            </>
          )}
          <Link to="/boards" className="flex flex-row items-end hover:opacity-80 transition-opacity">
            <p className="font-comorant-sc font-semibold text-2xl text-white leading-none"></p>
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
const UserDropdown: React.FC<UserDropdownProps & { isAdmin: boolean; isManager: boolean }> = ({ 
  userData, 
  onLogout,
  isAdmin,
  isManager 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  console.log('👤 UserDropdown - данные:', userData);
  console.log('👤 UserDropdown - роли:', userData.roles);
  console.log('👤 UserDropdown - isAdmin:', isAdmin);
  console.log('👤 UserDropdown - isManager:', isManager);

  const getRoleBadge = () => {
    if (isAdmin) {
      return <span className="ml-2 text-xs bg-red-600 px-2 py-0.5 rounded-full">Admin</span>;
    }
    if (isManager) {
      return <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-full">Manager</span>;
    }
    return <span className="ml-2 text-xs bg-gray-600 px-2 py-0.5 rounded-full">User</span>;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <UserOutlined className="text-black text-lg text-[24px]" />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">
                Аккаунт
              </div>
              {getRoleBadge()}
            </div>
            
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
                <span className="text-white font-medium text-sm">Роли:</span>
                <span className="text-gray-400 text-xs">
                  {userData.roles?.join(', ') || 'user'}
                </span>
              </div>
            </div>

            {(isAdmin || isManager) && (
              <>
                <div className="border-t border-gray-700 my-3"></div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/users');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm font-medium mb-2"
                >
                  <TeamOutlined />
                  <span>Управление пользователями</span>
                </button>
              </>
            )}

            <div className="border-t border-gray-700 my-3"></div>

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

const BoardDropdown: React.FC<BoardDropdownProps> = ({ currentBoardName, boards, currentBoardId, loading }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
        <>
          <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700">
                Ваши расследования
              </div>
              
              {loading ? (
                <div className="px-3 py-4 text-center">
                  <div className="text-gray-400 text-sm">Загрузка...</div>
                </div>
              ) : boards.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <div className="text-gray-400 text-sm mb-2">Нет созданных расследований</div>
                  <Link
                    to="/boards"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                    onClick={() => setIsOpen(false)}
                  >
                    Создать первое расследование
                  </Link>
                </div>
              ) : (
                <>
                  {boards.map((board) => (
                    <Link
                      key={board.id}
                      to={`/board/${board.id}`}
                      className={`block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors ${
                        board.id.toString() === currentBoardId.toString() ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="font-medium text-white text-sm truncate">
                        {board.title}
                      </div>
                      {board.description && (
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {board.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(board.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </Link>
                  ))}
                </>
              )}

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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
};

export default Navbar;