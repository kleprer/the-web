// components/DraggableText.jsx
import React, { useState } from 'react';

const DraggableText = ({ 
  id, 
  content, 
  position, 
  canvasOffset,
  className = "" 
}) => {
  const [text, setText] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [pos, setPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPos(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
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
        ${className}
      `}
      style={{
        left: pos.x + canvasOffset.x,
        top: pos.y + canvasOffset.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent text-white border border-white p-1 resize-none outline-none"
          autoFocus
        />
      ) : (
        <div className="border border-transparent hover:border-white p-1">
          {text}
        </div>
      )}
    </div>
  );
};

export default DraggableText;