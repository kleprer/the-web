import React, { useState, useRef, useEffect } from 'react';
import { TimelineEventProps } from '../types/props';

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, position, onEdit, onDelete }) => {
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const eventRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    });
  };

  // Обработчик левого клика - редактирование
  const handleClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(false); // Закрываем меню при обычном клике
    if (onEdit) {
      onEdit(event);
    }
  };

  // Обработчик правого клика - контекстное меню
  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Right click detected'); // Для отладки
    
    // Простая позиция - рядом с карточкой
    setShowContextMenu(true);
  };

  // Закрытие контекстного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  // Обработчик удаления
  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete && window.confirm('Вы уверены, что хотите удалить это событие?')) {
      onDelete(event.id);
    }
    setShowContextMenu(false);
  };

  return (
    <div
      ref={eventRef}
      className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${position}px` }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Вертикальная линия к точке на таймлайне */}
      <div className="w-0.5 h-16 bg-white"></div>
      
      {/* Точка на таймлайне */}
      <div className="w-3 h-3 bg-white rounded-full border-2 border-[#151516]"></div>
      
      {/* Карточка события */}
      <div className="absolute top-full mt-2 w-48 bg-[#2a2a2a] border border-white rounded-lg p-3 shadow-lg cursor-pointer hover:border-blue-500 transition-colors">
        <div className="text-xs text-gray-300 mb-1">
          {formatDate(event.event_date)}
        </div>
        <div className="text-sm font-semibold text-white">
          {event.title}
        </div>
        {event.description && (
          <div className="text-xs text-gray-400 mt-1">
            {event.description}
          </div>
        )}
        
        {/* Контекстное меню */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="absolute top-full left-0 mt-2 bg-[#2a2a2a] border border-white rounded-lg p-2 shadow-lg z-50 min-w-40"
          >
            <button
              onClick={handleDelete}
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 px-3 py-2 rounded text-sm transition-colors text-left whitespace-nowrap"
            >
              Удалить событие
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEvent;