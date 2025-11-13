// components/TimelineEvent.jsx
import React from 'react';

const TimelineEvent = ({ event, position, totalEvents }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div
      className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${position}px` }}
    >
      {/* Вертикальная линия к точке на таймлайне */}
      <div className="w-0.5 h-16 bg-white"></div>
      
      {/* Точка на таймлайне */}
      <div className="w-3 h-3 bg-white rounded-full border-2 border-[#151516]"></div>
      
      {/* Карточка события */}
      <div className="absolute top-full mt-2 w-48 bg-[#2a2a2a] border border-white rounded-lg p-3 shadow-lg">
        <div className="text-xs text-gray-300 mb-1">
          {formatDate(event.date)}
        </div>
        <div className="text-sm font-semibold text-white">
          {event.title}
        </div>
        {event.description && (
          <div className="text-xs text-gray-400 mt-1">
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEvent;