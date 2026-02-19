import React, { useState, useRef, useEffect } from 'react';
import { DraggableTextProps } from '../types/props';

const DraggableText: React.FC<DraggableTextProps> = ({ 
  id, 
  content, 
  position, 
  className = "",
  onEdit,
  onEditStart,
  onEditEnd,
  isEditMode = false,
  isSelected = false,
  onSelect,
  isEditing = false,
  ...props 
}) => {
  const [text, setText] = useState<string>(content);
  const [pos, setPos] = useState<{ x: number; y: number }>(position);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (isEditing) return;
    
    if (isEditMode && onSelect) {
      onSelect(id, e.shiftKey);
    }
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (!isDragging || isEditing) return;
    
    setPos(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
  };

  const handleDoubleClick = (): void => {
    if (isEditMode && !isEditing && onEditStart) {
      onEditStart(id);
    }
  };

  const handleSave = (): void => {
    if (onEdit && text !== content) {
      onEdit(id, text);
    }
    if (onEditEnd) {
      onEditEnd();
    }
  };

  const handleDelete = (): void => {
    if (onEdit && window.confirm('Удалить этот текст?')) {
      onEdit(id, { _delete: true });
    }
  };

  const handleCancel = (): void => {
    setText(content);
    if (onEditEnd) {
      onEditEnd();
    }
  };

  return (
    <div
      className={`
        absolute
        bg-transparent
        text-white
        cursor-move
        select-none
        p-2
        min-w-32
        min-h-8
        ${isDragging ? 'opacity-80 z-50 cursor-grabbing' : 'opacity-100'}
        ${isEditMode ? 'border-2 border-dashed' : 'border-2 border-transparent'}
        ${isSelected ? 'border-blue-400' : isEditMode ? 'border-white' : ''}
        ${isEditing ? 'border-yellow-400 z-50' : ''}
        ${className}
      `}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      {...props}
    >
      {isEditing ? (
        <div className="bg-[#151516] border border-white p-2 rounded">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            className="w-full h-20 bg-transparent text-white border border-gray-500 p-1 resize-none outline-none"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white py-1 px-2 text-sm rounded"
            >
              Сохранить
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-600 text-white py-1 px-2 text-sm rounded"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white py-1 px-2 text-sm rounded"
            >
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <div className="p-1 break-words whitespace-pre-wrap bg-[#151516] border border-transparent rounded">
          {text}
          {isEditMode && !isEditing && (
            <div className="text-xs text-gray-500 mt-1">
              Двойной клик для редактирования
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableText;