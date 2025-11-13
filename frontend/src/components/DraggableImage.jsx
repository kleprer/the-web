// components/DraggableImage.jsx
import React, { useState } from 'react';

const DraggableImage = ({ 
  id, 
  url, 
  position, 
  canvasOffset,
  className = "" 
}) => {
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

  return (
    <div
      className={`
        absolute
        cursor-move
        select-none
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
    >
      <img 
        src={url} 
        alt="Uploaded" 
        className="max-w-xs max-h-48 object-contain border border-white"
      />
    </div>
  );
};

export default DraggableImage;