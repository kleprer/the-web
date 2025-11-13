// components/CaseCard.jsx
import React, { useState } from 'react';

const CaseCard = ({ 
  title, 
  articleUrl, 
  date, 
  trustLevel = 'unknown',
  className = "",
  initialPosition = { x: 0, y: 0 }, // принимаем начальную позицию
  ...props 
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  // Trust level circle styles
  const getTrustLevelStyle = () => {
    switch (trustLevel) {
      case 'high': return 'bg-white border-white';
      case 'low': return 'bg-red-500 border-red-500';
      default: return 'bg-transparent border-white';
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`
        absolute
        border
        border-white
        bg-[#151516]
        text-white
        p-4
        cursor-move
        select-none
        w-80
        min-h-48
        ${isDragging ? 'opacity-80 z-50 cursor-grabbing' : 'opacity-100'}
        ${className}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      {...props}
    >
      {/* Content */}
      <div className="h-full flex flex-col">
        <h3 className="text-xl font-semibold mb-2 break-words">
          {title}
        </h3>

        {articleUrl && (
          <a 
            href={articleUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 mb-2 text-sm break-words"
            onClick={(e) => e.stopPropagation()}
          >
            {articleUrl}
          </a>
        )}

        <p className="text-gray-400 text-sm mt-auto">
          {date}
        </p>

        <div className="flex justify-between items-end mt-auto">
          <div className="text-xs text-gray-500">
            Уровень доверия
          </div>
          <div 
            className={`
              w-4 h-4 rounded-full border-2
              ${getTrustLevelStyle()}
            `}
          />
        </div>
      </div>
    </div>
  );
};

export default CaseCard;