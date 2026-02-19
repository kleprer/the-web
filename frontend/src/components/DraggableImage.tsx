import React, { useState } from 'react';
import { DraggableImageProps } from '../types/props';

const DraggableImage: React.FC<DraggableImageProps> = ({ 
  id, 
  url, 
  position, 
  className = "",
  onEdit,
  isEditMode = false,
  isSelected = false,
  isConnectingMode = false,
  onSelect,
  ...props 
}) => {
  const [pos, setPos] = useState<{ x: number; y: number }>(position);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (isConnectingMode) {
      e.stopPropagation();
      return;
    }
    if (isEditMode && onSelect) {
      onSelect(id, e.shiftKey);
    }
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (!isDragging) return;
    
    setPos(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
  };

  const handleDoubleClick = (): void => {
    if (isEditMode && onEdit) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const newUrl = URL.createObjectURL(file);
          onEdit(id, newUrl);
        }
      };
      input.click();
    }
  };

  const handleDelete = (): void => {
    if (onEdit && window.confirm('Удалить это изображение?')) {
      onEdit(id, { _delete: true });
    }
  };

  return (
    <div
      className={`
        absolute
        cursor-move
        select-none
        ${isDragging ? 'opacity-80 z-50 cursor-grabbing' : 'opacity-100'}
        ${isEditMode ? 'border-2 border-dashed' : 'border-2 border-transparent'}
        ${isSelected ? 'border-blue-400' : isEditMode ? 'border-white' : ''}
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
      <img 
        src={url} 
        alt="Uploaded" 
        className="max-w-xs max-h-48 object-contain"
      />
      
      {isEditMode && (
        <div className="absolute top-0 right-0 flex gap-1">
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white text-xs p-1 rounded hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
};

export default DraggableImage;