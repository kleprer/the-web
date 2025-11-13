import React from 'react';
import { useNavigate } from 'react-router-dom';

const BoardSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#151516] p-8">
      <h1 className="text-3xl text-white mb-6">Выбор доски</h1>
      <button 
        onClick={() => navigate('/board/1')}
        className="bg-white text-black px-6 py-3 rounded-lg"
      >
        Перейти к доске
      </button>
    </div>
  );
};

export default BoardSelection;