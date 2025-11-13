// pages/BoardSelection.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { UserOutlined } from '@ant-design/icons';

const BoardSelection = () => {
  const navigate = useNavigate();
  const [recentBoards, setRecentBoards] = useState([
    { id: 1, name: 'Расследование коррупции в мэрии', lastOpened: '2024-01-15' },
    { id: 2, name: 'Дело о незаконной застройке', lastOpened: '2024-01-10' },
    { id: 3, name: 'Финансовые махинации в банке', lastOpened: '2024-01-08' },
    { id: 4, name: 'Коррупция в образовании', lastOpened: '2024-01-05' },
    { id: 5, name: 'Налоговые нарушения компании', lastOpened: '2024-01-01' },
    { id: 6, name: 'Мошенничество с госзакупками', lastOpened: '2023-12-28' },
    { id: 7, name: 'Отмывание денег через ООО', lastOpened: '2023-12-25' }
  ]);

  const handleCreateNewBoard = () => {
    const newBoardId = Date.now();
    const newBoard = {
      id: newBoardId,
      name: `Новая доска ${recentBoards.length + 1}`,
      lastOpened: new Date().toISOString().split('T')[0]
    };
    
    setRecentBoards(prev => [newBoard, ...prev.slice(0, 4)]);
    navigate(`/board/${newBoardId}`);
  };

  const handleSelectBoard = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  const displayBoards = recentBoards.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#151516] text-white">
      {/* Navbar */}
      <nav className="bg-transparent p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <UserOutlined className="text-black text-lg" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="font-comorant-sc font-semibold text-2xl text-white leading-none">
                ПАУТИНА
              </p>
              <p className="font-inter font-light text-sm text-white leading-none mt-1">
                ассистент журналиста
              </p>
            </div>
            <img src="/logo.svg" alt="Логотип" className="h-10 w-10" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        <h1 className="text-3xl font-semibold text-center mb-12">Выбор доски расследования</h1>
        
        <div className="flex gap-8 justify-center items-start flex-col md:flex-row">
          {/* Левая карточка - Создать новую доску */}
          <div 
            onClick={handleCreateNewBoard}
            className="border-2 border-white border-opacity-50 rounded-lg bg-transparent w-80 h-96 flex flex-col items-center justify-center cursor-pointer hover:border-opacity-100 hover:bg-white hover:bg-opacity-5 transition-all duration-200"
          >
            <PlusOutlined className="text-6xl text-white mb-4" />
            <span className="text-xl text-white font-semibold">Добавить доску</span>
          </div>

          {/* Правая карточка - Список досок */}
          <div className="border-2 border-white border-opacity-50 rounded-lg bg-transparent w-80 h-96 flex flex-col">
            {/* Заголовок */}
            <div className="p-6 border-b border-white border-opacity-30">
              <h2 className="text-2xl font-semibold text-white text-center">
                Выбрать недавнюю
              </h2>
            </div>
            
            {/* Список досок с кастомным скроллом */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {displayBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => handleSelectBoard(board.id)}
                  className="border border-white border-opacity-30 rounded-lg p-4 cursor-pointer hover:border-opacity-100 hover:bg-white hover:bg-opacity-5 transition-all duration-200"
                >
                  <h3 className="text-lg font-medium text-white mb-1 line-clamp-2">
                    {board.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Открыто: {board.lastOpened}
                  </p>
                </div>
              ))}

              {displayBoards.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Нет недавних досок
                </div>
              )}
            </div>

            {/* Счетчик досок */}
            <div className="p-4 border-t border-white border-opacity-30">
              <p className="text-sm text-gray-400 text-center">
                Показано {displayBoards.length} из {recentBoards.length} досок
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p>Выберите существующую доску или создайте новую для начала расследования</p>
        </div>
      </div>

      {/* Стили для кастомного скроллбара */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default BoardSelection;