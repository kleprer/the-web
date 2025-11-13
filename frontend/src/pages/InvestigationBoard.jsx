// pages/InvestigationBoard.jsx
import React, { useState, useRef, useCallback } from 'react';
import CaseCard from '../components/CaseCard';
import Toolbar from '../components/Toolbar';
import DraggableText from '../components/DraggableText';
import DraggableImage from '../components/DraggableImage';

const InvestigationBoard = () => {
  const [cards, setCards] = useState([]);
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [isMovingCanvas, setIsMovingCanvas] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const canvasRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Canvas dragging
  const handleCanvasMouseDown = (e) => {
    if (!isMovingCanvas || e.target !== canvasRef.current) return;
    
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX - canvasOffset.x,
      y: e.clientY - canvasOffset.y
    };
    e.preventDefault();
  };

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isDraggingCanvas) return;
    
    setCanvasOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  }, [isDraggingCanvas]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
  }, []);

  // Add event listeners for canvas dragging
  React.useEffect(() => {
    if (isDraggingCanvas) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleCanvasMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDraggingCanvas, handleCanvasMouseMove, handleCanvasMouseUp]);

  // Toolbar actions
  const handleSelectArea = () => {
    console.log('Select area tool activated');
    setIsMovingCanvas(false);
  };

  const handleMoveCanvas = () => {
    setIsMovingCanvas(!isMovingCanvas);
  };

  const handleAddCard = () => {
    const newCard = {
      id: Date.now(),
      title: 'Новая карточка',
      articleUrl: '',
      date: new Date().toISOString().split('T')[0],
      trustLevel: 'unknown',
      // Позиция относительно канваса (без offset)
      position: { x: 100, y: 100 }
    };
    setCards(prev => [...prev, newCard]);
    setIsMovingCanvas(false);
  };

  const handleAddText = () => {
    const newText = {
      id: Date.now(),
      content: 'Новый текст',
      position: { x: 100, y: 150 }
    };
    setTexts(prev => [...prev, newText]);
    setIsMovingCanvas(false);
  };

  const handleConnect = () => {
    console.log('Connect tool activated');
    setIsMovingCanvas(false);
  };

  const handleAddPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const newImage = {
          id: Date.now(),
          file,
          url: URL.createObjectURL(file),
          position: { x: 100, y: 200 }
        };
        setImages(prev => [...prev, newImage]);
      }
    };
    input.click();
    setIsMovingCanvas(false);
  };

  return (
    <div 
      className="relative w-full h-screen bg-[#151516] overflow-hidden"
      style={{ cursor: isMovingCanvas ? 'grab' : 'default' }}
    >
      {/* Infinite Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
          width: '5000px',
          height: '5000px',
          background: `
            linear-gradient(90deg, #151516 1px, transparent 1px),
            linear-gradient(180deg, #151516 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: `${canvasOffset.x % 20}px ${canvasOffset.y % 20}px`
        }}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Render cards - передаем позицию как initialPosition */}
        {cards.map(card => (
          <CaseCard
            key={card.id}
            title={card.title}
            articleUrl={card.articleUrl}
            date={card.date}
            trustLevel={card.trustLevel}
            initialPosition={card.position} // ✅ передаем позицию как проп
          />
        ))}

        {/* Render draggable texts */}
        {texts.map(text => (
          <DraggableText
            key={text.id}
            content={text.content}
            position={text.position}
            canvasOffset={canvasOffset}
          />
        ))}

        {/* Render draggable images */}
        {images.map(image => (
          <DraggableImage
            key={image.id}
            url={image.url}
            position={image.position}
            canvasOffset={canvasOffset}
          />
        ))}
      </div>

      {/* Toolbar */}
      <Toolbar
        onSelectArea={handleSelectArea}
        onMoveCanvas={handleMoveCanvas}
        onAddCard={handleAddCard}
        onAddText={handleAddText}
        onConnect={handleConnect}
        onAddPhoto={handleAddPhoto}
        isMovingCanvas={isMovingCanvas}
      />
    </div>
  );
};

export default InvestigationBoard;