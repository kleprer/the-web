import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Investigation } from '../types/index';
import SEOMeta from '../components/SEOMeta';

const BoardSelection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newBoardName, setNewBoardName] = useState<string>('');
  const [newBoardDescription, setNewBoardDescription] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  const loadInvestigations = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const data = await apiService.getInvestigations(user.id);
      setInvestigations(data);
    } catch (error) {
      console.error('ошибка загрузки расследований:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  const handleCreateNewBoard = (): void => {
    setShowCreateModal(true);
  };

  const handleSubmitNewBoard = async (): Promise<void> => {
    if (!newBoardName.trim()) {
      alert('введите название расследования');
      return;
    }

    if (!user?.id) return;

    setCreating(true);
    try {
      const newInvestigation = await apiService.createInvestigation({
        title: newBoardName.trim(),
        description: newBoardDescription.trim(),
        user_id: user.id
      });

      setShowCreateModal(false);
      setNewBoardName('');
      setNewBoardDescription('');
      
      navigate(`/board/${newInvestigation.id}`);
      
    } catch (error) {
      console.error('ошибка создания расследования:', error);
      alert('ошибка при создании расследования: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = (): void => {
    setShowCreateModal(false);
    setNewBoardName('');
    setNewBoardDescription('');
  };

  const handleSelectBoard = (boardId: number): void => {
    navigate(`/board/${boardId}`);
  };

  const displayBoards = investigations.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-[#151516] min-h-screen text-white">
        <Navbar currentBoardName='' />
        <div className="container mx-auto px-8 py-12 mt-[5rem] text-center">
          загрузка...
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="мои расследования"
        description="управление журналистскими расследованиями: создавайте новые доски, просматривайте существующие и продолжайте работу над материалами"
        canonicalUrl="/boards"
        type="website"
      />
      
      <div className="bg-[#151516] text-white min-h-screen">
        <Navbar currentBoardName='' />

        <div className="container mx-auto px-8 py-12 mt-[5rem]">
          <h1 className="text-3xl font-semibold text-center mb-12">
            выбор доски расследования
          </h1>
          
          <div className="flex gap-8 justify-center items-start flex-col md:flex-row">
            <div 
              onClick={handleCreateNewBoard}
              className="border-2 border-white border-opacity-50 rounded-lg bg-transparent w-80 h-96 flex flex-col items-center justify-center cursor-pointer hover:border-opacity-100 hover:bg-white hover:bg-opacity-5 transition-all duration-200"
            >
              <PlusOutlined className="text-6xl text-white mb-4" />
              <span className="text-xl text-white font-semibold">создать новое расследование</span>
            </div>

            <div className="border-2 border-white border-opacity-50 rounded-lg bg-transparent w-80 h-96 flex flex-col">
              <div className="p-6 border-b border-white border-opacity-30">
                <h2 className="text-2xl font-semibold text-white text-center">
                  ваши расследования
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {displayBoards.map((investigation) => (
                  <div
                    key={investigation.id}
                    onClick={() => handleSelectBoard(investigation.id)}
                    className="border border-white border-opacity-30 rounded-lg p-4 cursor-pointer hover:border-opacity-100 hover:bg-white hover:bg-opacity-5 transition-all duration-200"
                  >
                    <h3 className="text-lg font-medium text-white mb-1 line-clamp-2">
                      {investigation.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {investigation.description || 'без описания'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      создано: {new Date(investigation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {displayBoards.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    нет созданных расследований
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white border-opacity-30">
                <p className="text-sm text-gray-400 text-center">
                  показано {displayBoards.length} из {investigations.length} расследований
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12 text-gray-400">
            <p>выберите существующее расследование или создайте новое</p>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#151516] border border-white border-opacity-30 rounded-lg p-6 w-96">
              <h2 className="text-xl font-semibold text-white mb-4">
                создать новое расследование
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">
                    название расследования *
                  </label>
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBoardName(e.target.value)}
                    placeholder="введите название"
                    className="w-full bg-transparent border border-white border-opacity-30 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm mb-2 block">
                    описание (необязательно)
                  </label>
                  <textarea
                    value={newBoardDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBoardDescription(e.target.value)}
                    placeholder="описание расследования"
                    rows={3}
                    className="w-full bg-transparent border border-white border-opacity-30 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmitNewBoard}
                  disabled={creating || !newBoardName.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {creating ? 'создание...' : 'создать'}
                </button>
                <button
                  onClick={handleCancelCreate}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BoardSelection;