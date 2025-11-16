import React, { useState } from 'react';

const CaseCard = ({ 
  id,
  title, 
  articleUrl, 
  date, 
  trustLevel = 'unknown',
  className = "",
  initialPosition = { x: 0, y: 0 },
  onEdit,
  onEditStart,
  onEditEnd,
  isEditMode = false,
  isSelected = false,
  onSelect,
  isEditing = false,
  ...props 
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [editData, setEditData] = useState({
    title: title || '',
    articleUrl: articleUrl || '',
    date: date || '',
    trustLevel: trustLevel || 'unknown'
  });

  // Синхронизируем с пропсами
  React.useEffect(() => {
    setEditData({
      title: title || '',
      articleUrl: articleUrl || '',
      date: date || '',
      trustLevel: trustLevel || 'unknown'
    });
  }, [title, articleUrl, date, trustLevel]);

  const getTrustLevelStyle = (level) => {
    switch (level) {
      case 'high': return 'bg-white border-white';
      case 'low': return 'bg-red-500 border-red-500';
      default: return 'bg-transparent border-white';
    }
  };

  const getTrustLevelLabel = (level) => {
    switch (level) {
      case 'high': return 'Высокое';
      case 'low': return 'Низкое';
      default: return 'Среднее';
    }
  };

  const handleMouseDown = (e) => {
    if (isEditing) return; // Если редактируем - блокируем перемещение
    
    if (isEditMode && onSelect) {
      onSelect(id, e.shiftKey);
    }
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isEditing) return;
    
    setPosition(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e) => {
    if (isEditMode && !isEditing) {
      if (e.target.closest('.trust-indicator')) {
        const levels = ['high', 'unknown', 'low'];
        const currentIndex = levels.indexOf(trustLevel);
        const nextLevel = levels[(currentIndex + 1) % levels.length];
        
        if (onEdit) {
          onEdit(id, { title, articleUrl, date, trustLevel: nextLevel });
        }
      } else {
        // Начинаем редактирование
        if (onEditStart) {
          onEditStart(id);
        }
      }
    }
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editData);
    }
    if (onEditEnd) {
      onEditEnd();
    }
  };

  const handleCancel = () => {
    setEditData({ title, articleUrl, date, trustLevel });
    if (onEditEnd) {
      onEditEnd();
    }
  };

  const handleTrustLevelChange = (newLevel) => {
    setEditData(prev => ({ ...prev, trustLevel: newLevel }));
  };

  const handleDelete = () => {
    if (onEdit && window.confirm('Удалить эту карточку?')) {
      onEdit(id, { _delete: true });
    }
  };

  return (
    <div
      className={`
        absolute
        border-2
        ${isSelected ? 'border-blue-400' : 'border-white'}
        bg-[#151516]
        text-white
        p-4
        cursor-move
        select-none
        w-80
        min-h-48
        ${isDragging ? 'opacity-80 z-50 cursor-grabbing' : 'opacity-100'}
        ${isEditMode ? 'border-dashed' : 'border-solid'}
        ${isEditing ? 'border-yellow-400 z-50' : ''}
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
      onDoubleClick={handleDoubleClick}
      {...props}
    >
      <div className="h-full flex flex-col">
        {isEditing ? (
          // РЕЖИМ РЕДАКТИРОВАНИЯ
          <>
            <textarea
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              className="text-xl font-semibold mb-2 bg-transparent text-white border border-gray-500 p-1 resize-none w-full"
              rows={3}
              autoFocus
              placeholder="Заголовок карточки"
            />

            <input
              type="text"
              value={editData.articleUrl}
              onChange={(e) => setEditData(prev => ({ ...prev, articleUrl: e.target.value }))}
              className="text-blue-400 mb-2 bg-transparent border border-gray-500 p-1 text-sm w-full"
              placeholder="https://example.com/article"
            />

            <input
              type="text"
              value={editData.date}
              onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
              className="text-gray-400 bg-transparent border border-gray-500 p-1 text-sm w-full"
              placeholder="Дата публикации"
            />

            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-gray-500">
                Уровень доверия
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTrustLevelChange('high')}
                  className={`w-6 h-6 rounded-full border-2 border-white ${
                    editData.trustLevel === 'high' ? 'bg-white' : 'bg-transparent'
                  }`}
                  title="Высокий"
                />
                <button
                  onClick={() => handleTrustLevelChange('unknown')}
                  className={`w-6 h-6 rounded-full border-2 border-white ${
                    editData.trustLevel === 'unknown' ? 'bg-white' : 'bg-transparent'
                  }`}
                  title="Неизвестно"
                />
                <button
                  onClick={() => handleTrustLevelChange('low')}
                  className={`w-6 h-6 rounded-full border-2 border-red-500 ${
                    editData.trustLevel === 'low' ? 'bg-red-500' : 'bg-transparent'
                  }`}
                  title="Низкий"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 text-white py-1 px-2 text-sm rounded hover:bg-green-700"
              >
                Сохранить
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 text-white py-1 px-2 text-sm rounded hover:bg-gray-700"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-1 px-2 text-sm rounded hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </>
        ) : (
          // РЕЖИМ ПРОСМОТРА
          <>
            <h3 className="text-xl font-semibold mb-2 break-words">
              {title || 'Без названия'}
            </h3>

            {/* URL СТАТЬИ - ТЕПЕРЬ РАБОТАЕТ ПРАВИЛЬНО */}
            {articleUrl && (
              <a 
                href={articleUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 mb-2 text-sm break-words underline block"
                onClick={(e) => e.stopPropagation()}
              >
                {articleUrl.length > 50 ? articleUrl.substring(0, 50) + '...' : articleUrl}
              </a>
            )}

            <p className="text-gray-400 text-sm mt-auto">
              {date || 'Без даты'}
            </p>

            <div className="flex justify-between items-end mt-auto">
              <div className="text-xs text-gray-500">
                Уровень доверия
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {getTrustLevelLabel(trustLevel)}
                </span>
                <div 
                  className={`
                    trust-indicator
                    w-4 h-4 rounded-full border-2 cursor-pointer
                    ${getTrustLevelStyle(trustLevel)}
                  `}
                />
              </div>
            </div>

            {isEditMode && !isEditing && (
              <div className="text-xs text-gray-500 text-center mt-2">
                Двойной клик для редактирования
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CaseCard;