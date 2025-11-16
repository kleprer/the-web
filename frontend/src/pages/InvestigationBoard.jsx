import React, { useState, useRef, useCallback, useEffect } from 'react';
import CaseCard from '../components/CaseCard';
import Toolbar from '../components/Toolbar';
import DraggableText from '../components/DraggableText';
import DraggableImage from '../components/DraggableImage';
import ConnectionLine from '../components/ConnectionLine';
import Navbar from '../components/Navbar';

const InvestigationBoard = () => {
  const [cards, setCards] = useState([]);
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedElements, setSelectedElements] = useState(new Set());
  const [isMovingCanvas, setIsMovingCanvas] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null);
  const [connectingStart, setConnectingStart] = useState(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [editingElementId, setEditingElementId] = useState(null); // Новое состояние для редактируемого элемента
  
  const canvasRef = useRef(null);

  // ФУНКЦИИ ДЛЯ РАБОТЫ С ЭЛЕМЕНТАМИ
  const getAllElements = () => [
    ...cards.map(card => ({ ...card, type: 'card' })),
    ...texts.map(text => ({ ...text, type: 'text' })),
    ...images.map(img => ({ ...img, type: 'image' }))
  ];

  const getElementRect = (element) => {
    const dimensions = {
      'card': { width: 320, height: 192 },
      'text': { width: 200, height: 100 },
      'image': { width: 200, height: 150 }
    };
    
    return {
      x: element.position.x,
      y: element.position.y,
      width: dimensions[element.type].width,
      height: dimensions[element.type].height
    };
  };

  const getElementCenter = (element) => {
    const rect = getElementRect(element);
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  };

  const findElementAtPoint = (x, y) => {
    const allElements = getAllElements();
    return allElements.find(element => {
      const rect = getElementRect(element);
      return x >= rect.x && x <= rect.x + rect.width && 
             y >= rect.y && y <= rect.y + rect.height;
    });
  };

  const isRectOverlap = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  // ДВОЙНОЙ КЛИК ПО КАНВАСУ - СБРОС РЕЖИМОВ
  const handleCanvasDoubleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - canvasOffset.x;
    const clickY = e.clientY - rect.top - canvasOffset.y;

    const clickedElement = findElementAtPoint(clickX, clickY);
    
    // Если кликнули по пустому месту (не по элементу) - сбрасываем режимы
    if (!clickedElement) {
      resetTools();
    }
  };

  // ОБНОВЛЕННЫЙ: ОБРАБОТЧИКИ МЫШИ ДЛЯ ГРУППОВОГО ПЕРЕМЕЩЕНИЯ
  const handleCanvasMouseDown = (e) => {
    // Если элемент в режиме редактирования - игнорируем клики
    if (editingElementId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - canvasOffset.x;
    const clickY = e.clientY - rect.top - canvasOffset.y;

    if (isConnecting) {
      // РЕЖИМ СОЕДИНЕНИЯ
      const element = findElementAtPoint(clickX, clickY);
      if (element) {
        if (!connectingStart) {
          setConnectingStart({
            elementId: element.id,
            elementType: element.type,
            x: getElementCenter(element).x,
            y: getElementCenter(element).y
          });
        } else {
          if (connectingStart.elementId !== element.id) {
            const newConnection = {
              id: `conn-${Date.now()}`,
              start: { elementId: connectingStart.elementId, type: connectingStart.elementType },
              end: { elementId: element.id, type: element.type }
            };
            setConnections(prev => [...prev, newConnection]);
          }
          setConnectingStart(null);
        }
      }
    } else if (isSelecting) {
      // РЕЖИМ ВЫДЕЛЕНИЯ
      setSelectionStart({ x: clickX, y: clickY });
      if (!e.shiftKey) setSelectedElements(new Set());
    } else if (isMovingCanvas) {
      // РЕЖИМ ПЕРЕМЕЩЕНИЯ КАНВАСА
      setIsDraggingCanvas(true);
    } else {
      // ПРОВЕРЯЕМ, НАЖАЛИ ЛИ НА ЭЛЕМЕНТ ИЛИ НА ПУСТОЕ МЕСТО
      const clickedElement = findElementAtPoint(clickX, clickY);
      
      if (clickedElement) {
        // НАЖАЛИ НА ЭЛЕМЕНТ - ВЫДЕЛЯЕМ/СНИМАЕМ ВЫДЕЛЕНИЕ
        handleElementSelect(clickedElement.id, e.shiftKey);
        
        // НАЧИНАЕМ ПЕРЕТАСКИВАНИЕ ВЫДЕЛЕННЫХ ЭЛЕМЕНТОВ
        if (selectedElements.has(clickedElement.id) || !e.shiftKey) {
          setIsDraggingSelection(true);
          setDragStart({ 
            x: e.clientX, 
            y: e.clientY,
            initialPositions: getAllElements()
              .filter(el => selectedElements.has(el.id))
              .map(el => ({ id: el.id, type: el.type, position: { ...el.position } }))
          });
        }
      } else {
        // НАЖАЛИ НА ПУСТОЕ МЕСТО - СБРАСЫВАЕМ ВЫДЕЛЕНИЕ
        if (!e.shiftKey) setSelectedElements(new Set());
      }
    }
    
    e.preventDefault();
  };

  const handleCanvasMouseMove = useCallback((e) => {
    // Если элемент в режиме редактирования - игнорируем перемещение
    if (editingElementId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left - canvasOffset.x;
    const currentY = e.clientY - rect.top - canvasOffset.y;

    if (isDraggingCanvas) {
      // ПЕРЕМЕЩЕНИЕ КАНВАСА
      setCanvasOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    } else if (isSelecting && selectionStart) {
      // ВЫДЕЛЕНИЕ ОБЛАСТИ
      setSelectionRect({
        x: Math.min(selectionStart.x, currentX),
        y: Math.min(selectionStart.y, currentY),
        width: Math.abs(currentX - selectionStart.x),
        height: Math.abs(currentY - selectionStart.y)
      });
    } else if (isConnecting && connectingStart) {
      // ВРЕМЕННАЯ ЛИНИЯ СОЕДИНЕНИЯ
      setTempConnectionEnd({ x: currentX, y: currentY });
    } else if (isDraggingSelection && dragStart && selectedElements.size > 0) {
      // ГРУППОВОЕ ПЕРЕМЕЩЕНИЕ ВЫДЕЛЕННЫХ ЭЛЕМЕНТОВ
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // ОБНОВЛЯЕМ ВСЕ ВЫДЕЛЕННЫЕ ЭЛЕМЕНТЫ НА ОСНОВЕ ИЗНАЧАЛЬНЫХ ПОЗИЦИЙ
      dragStart.initialPositions.forEach(({ id, type, position }) => {
        const newPosition = {
          x: position.x + deltaX,
          y: position.y + deltaY
        };

        if (type === 'card') {
          setCards(prev => prev.map(card => 
            card.id === id ? { ...card, position: newPosition } : card
          ));
        } else if (type === 'text') {
          setTexts(prev => prev.map(text => 
            text.id === id ? { ...text, position: newPosition } : text
          ));
        } else if (type === 'image') {
          setImages(prev => prev.map(img => 
            img.id === id ? { ...img, position: newPosition } : img
          ));
        }
      });
    }
  }, [isDraggingCanvas, isSelecting, selectionStart, isConnecting, connectingStart, isDraggingSelection, selectedElements, canvasOffset, dragStart, editingElementId]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isSelecting && selectionRect) {
      // ЗАВЕРШЕНИЕ ВЫДЕЛЕНИЯ ОБЛАСТИ
      const allElements = getAllElements();
      const selected = new Set(selectedElements);
      
      allElements.forEach(element => {
        const elementRect = getElementRect(element);
        if (isRectOverlap(selectionRect, elementRect)) {
          selected.add(element.id);
        }
      });
      
      setSelectedElements(selected);
    }

    // СБРОС ВСЕХ СОСТОЯНИЙ ПЕРЕТАСКИВАНИЯ
    setSelectionStart(null);
    setSelectionRect(null);
    setIsDraggingCanvas(false);
    setIsDraggingSelection(false);
    setDragStart(null);
  }, [isSelecting, selectionRect, selectedElements]);

  // EVENT LISTENERS
  useEffect(() => {
    document.addEventListener('mousemove', handleCanvasMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleCanvasMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  // УПРАВЛЕНИЕ СТРЕЛКАМИ
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Если элемент в режиме редактирования - игнорируем клавиши
      if (editingElementId) return;

      if (selectedElements.size > 0 && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const moveStep = e.shiftKey ? 10 : 1;
        const movement = {
          'ArrowUp': { x: 0, y: -moveStep },
          'ArrowDown': { x: 0, y: moveStep },
          'ArrowLeft': { x: -moveStep, y: 0 },
          'ArrowRight': { x: moveStep, y: 0 }
        }[e.key];

        setCards(prev => prev.map(card => 
          selectedElements.has(card.id) 
            ? { ...card, position: { x: card.position.x + movement.x, y: card.position.y + movement.y } }
            : card
        ));
        setTexts(prev => prev.map(text => 
          selectedElements.has(text.id)
            ? { ...text, position: { x: text.position.x + movement.x, y: text.position.y + movement.y } }
            : text
        ));
        setImages(prev => prev.map(img =>
          selectedElements.has(img.id)
            ? { ...img, position: { x: img.position.x + movement.x, y: img.position.y + movement.y } }
            : img
        ));
      }

      // УДАЛЕНИЕ DELETE/BACKSPACE
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.size > 0) {
        e.preventDefault();
        if (window.confirm(`Удалить ${selectedElements.size} элементов?`)) {
          setCards(prev => prev.filter(card => !selectedElements.has(card.id)));
          setTexts(prev => prev.filter(text => !selectedElements.has(text.id)));
          setImages(prev => prev.filter(img => !selectedElements.has(img.id)));
          // УДАЛЯЕМ СОЕДИНЕНИЯ С УДАЛЕННЫМИ ЭЛЕМЕНТАМИ
          setConnections(prev => prev.filter(conn => 
            !selectedElements.has(conn.start.elementId) && !selectedElements.has(conn.end.elementId)
          ));
          setSelectedElements(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, editingElementId]);

  // TOOLBAR ACTIONS
  const handleSelectArea = () => {
    setIsSelecting(true);
    setIsMovingCanvas(false);
    setIsConnecting(false);
  };

  const handleMoveCanvas = () => {
    setIsMovingCanvas(!isMovingCanvas);
    setIsSelecting(false);
    setIsConnecting(false);
  };

  const handleAddCard = () => {
    const newCard = {
      id: Date.now(),
      title: 'Новая карточка',
      articleUrl: '',
      date: new Date().toISOString().split('T')[0],
      trustLevel: 'unknown',
      position: { x: 100, y: 100 }
    };
    setCards(prev => [...prev, newCard]);
    resetTools();
  };

  const handleAddText = () => {
    const newText = {
      id: Date.now(),
      content: 'Новый текст',
      position: { x: 100, y: 150 }
    };
    setTexts(prev => [...prev, newText]);
    resetTools();
  };

  const handleConnect = () => {
    setIsConnecting(!isConnecting);
    setIsMovingCanvas(false);
    setIsSelecting(false);
    setConnectingStart(null);
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
    resetTools();
  };

  const resetTools = () => {
    setIsMovingCanvas(false);
    setIsSelecting(false);
    setIsConnecting(false);
    setConnectingStart(null);
    setTempConnectionEnd(null);
  };

  // ОБРАБОТЧИКИ РЕДАКТИРОВАНИЯ ЭЛЕМЕНТОВ
  const handleCardEdit = (id, newData) => {
    if (newData._delete) {
      setCards(prev => prev.filter(card => card.id !== id));
      setConnections(prev => prev.filter(conn => 
        conn.start.elementId !== id && conn.end.elementId !== id
      ));
      setEditingElementId(null);
    } else {
      setCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...newData } : card
      ));
      // Если это сохранение - выходим из режима редактирования
      if (!newData.isEditing) {
        setEditingElementId(null);
      }
    }
  };

  const handleTextEdit = (id, newData) => {
    if (newData._delete) {
      setTexts(prev => prev.filter(text => text.id !== id));
      setConnections(prev => prev.filter(conn => 
        conn.start.elementId !== id && conn.end.elementId !== id
      ));
      setEditingElementId(null);
    } else {
      setTexts(prev => prev.map(text => 
        text.id === id ? { ...text, content: newData } : text
      ));
      // Если это сохранение - выходим из режима редактирования
      if (typeof newData === 'string') {
        setEditingElementId(null);
      }
    }
  };

  const handleImageEdit = (id, newData) => {
    if (newData._delete) {
      setImages(prev => prev.filter(img => img.id !== id));
      setConnections(prev => prev.filter(conn => 
        conn.start.elementId !== id && conn.end.elementId !== id
      ));
      setEditingElementId(null);
    } else {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, url: newData } : img
      ));
    }
  };

  // ВЫДЕЛЕНИЕ ЭЛЕМЕНТОВ - ИСПРАВЛЕННАЯ ЛОГИКА
  const handleElementSelect = (id, isMultiSelect = false) => {
    // Если элемент уже в режиме редактирования - не выделяем его
    if (editingElementId === id) return;

    setSelectedElements(prev => {
      const newSelection = isMultiSelect ? new Set(prev) : new Set();
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  // ОБРАБОТЧИК НАЧАЛА РЕДАКТИРОВАНИЯ
  const handleElementEditStart = (id) => {
    setEditingElementId(id);
    // Снимаем выделение с редактируемого элемента
    setSelectedElements(prev => {
      const newSelection = new Set(prev);
      newSelection.delete(id);
      return newSelection;
    });
  };

  // ОБРАБОТЧИК ЗАВЕРШЕНИЯ РЕДАКТИРОВАНИЯ
  const handleElementEditEnd = () => {
    setEditingElementId(null);
  };

  // ПОЛУЧЕНИЕ ПОЗИЦИЙ ДЛЯ СОЕДИНЕНИЙ (АВТОМАТИЧЕСКИ ОБНОВЛЯЕТСЯ ПРИ ПЕРЕМЕЩЕНИИ ЭЛЕМЕНТОВ)
  const getElementPosition = (elementId, type) => {
    let element;
    if (type === 'card') element = cards.find(card => card.id === elementId);
    else if (type === 'text') element = texts.find(text => text.id === elementId);
    else if (type === 'image') element = images.find(img => img.id === elementId);
    
    return element ? getElementCenter({ ...element, type }) : null;
  };

  // КУРСОР
  const getCanvasCursor = () => {
    if (editingElementId) return 'default';
    if (isMovingCanvas) return isDraggingCanvas ? 'grabbing' : 'grab';
    if (isSelecting) return 'crosshair';
    if (isConnecting) return 'crosshair';
    if (isDraggingSelection && selectedElements.size > 0) return 'grabbing';
    if (selectedElements.size > 0) return 'move';
    return 'default';
  };

  return (
    <div className="relative w-full h-screen bg-[#151516] overflow-hidden">
      <Navbar />
      {/* INFINITE CANVAS */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
          width: '5000px',
          height: '5000px',
          background: `
            linear-gradient(90deg, #252527 1px, transparent 1px),
            linear-gradient(180deg, #252527 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          cursor: getCanvasCursor()
        }}
        onMouseDown={handleCanvasMouseDown}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* SELECTION RECTANGLE */}
        {selectionRect && (
          <div
            className="absolute border-2 border-blue-400 bg-blue-400 bg-opacity-20"
            style={{
              left: selectionRect.x,
              top: selectionRect.y,
              width: selectionRect.width,
              height: selectionRect.height
            }}
          />
        )}

        {/* TEMP CONNECTION LINE */}
        {connectingStart && tempConnectionEnd && (
          <ConnectionLine
            start={{ x: connectingStart.x, y: connectingStart.y }}
            end={tempConnectionEnd}
            isTemp={true}
          />
        )}

        {/* PERMANENT CONNECTIONS - АВТОМАТИЧЕСКИ ОБНОВЛЯЮТСЯ ПРИ ПЕРЕМЕЩЕНИИ ЭЛЕМЕНТОВ */}
        {connections.map(connection => {
          const startPos = getElementPosition(connection.start.elementId, connection.start.type);
          const endPos = getElementPosition(connection.end.elementId, connection.end.type);
          
          if (!startPos || !endPos) return null;
          
          return (
            <ConnectionLine
              key={connection.id}
              start={startPos}
              end={endPos}
            />
          );
        })}

        {/* CARDS */}
        {cards.map(card => (
          <CaseCard
            key={card.id}
            id={card.id}
            title={card.title}
            articleUrl={card.articleUrl}
            date={card.date}
            trustLevel={card.trustLevel}
            initialPosition={card.position}
            onEdit={handleCardEdit}
            onEditStart={handleElementEditStart}
            onEditEnd={handleElementEditEnd}
            isEditMode={true}
            isSelected={selectedElements.has(card.id)}
            onSelect={handleElementSelect}
            isEditing={editingElementId === card.id}
          />
        ))}

        {/* TEXTS */}
        {texts.map(text => (
          <DraggableText
            key={text.id}
            id={text.id}
            content={text.content}
            position={text.position}
            onEdit={handleTextEdit}
            onEditStart={handleElementEditStart}
            onEditEnd={handleElementEditEnd}
            isEditMode={true}
            isSelected={selectedElements.has(text.id)}
            onSelect={handleElementSelect}
            isEditing={editingElementId === text.id}
          />
        ))}

        {/* IMAGES */}
        {images.map(image => (
          <DraggableImage
            key={image.id}
            id={image.id}
            url={image.url}
            position={image.position}
            onEdit={handleImageEdit}
            isEditMode={true}
            isSelected={selectedElements.has(image.id)}
            onSelect={handleElementSelect}
          />
        ))}
      </div>

      {/* TOOLBAR */}
      <Toolbar
        onSelectArea={handleSelectArea}
        onMoveCanvas={handleMoveCanvas}
        onAddCard={handleAddCard}
        onAddText={handleAddText}
        onConnect={handleConnect}
        onAddPhoto={handleAddPhoto}
        isMovingCanvas={isMovingCanvas}
      />

      {/* STATUS BAR */}
      <div className="fixed top-20 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm font-medium z-40">
        <div>Выбрано: <span className="text-blue-400">{selectedElements.size}</span></div>
        {editingElementId && <div className="text-orange-400">• Редактирование элемента</div>}
        {isSelecting && <div className="text-green-400">• Выделение</div>}
        {isMovingCanvas && <div className="text-yellow-400">• Перемещение канваса</div>}
        {isConnecting && (
          <div className="text-purple-400">
            • Соединение - {connectingStart ? 'Выберите второй элемент' : 'Выберите первый элемент'}
          </div>
        )}
        {selectedElements.size > 0 && (
          <div className="text-gray-400 text-xs mt-1">
            Перетаскивайте или используйте стрелки • Delete для удаления
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationBoard;