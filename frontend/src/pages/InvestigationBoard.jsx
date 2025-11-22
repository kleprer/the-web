// frontend/src/pages/InvestigationBoard.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CaseCard from '../components/CaseCard';
import Toolbar from '../components/Toolbar';
import DraggableText from '../components/DraggableText';
import DraggableImage from '../components/DraggableImage';
import ConnectionLine from '../components/ConnectionLine';
import Navbar from '../components/Navbar';
import { apiService } from '../services/api';

const InvestigationBoard = () => {
  const { boardId } = useParams();
  const [investigation, setInvestigation] = useState(null);
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
  const [editingElementId, setEditingElementId] = useState(null);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  
  const canvasRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const needsSaveRef = useRef(false);

  // Загрузка данных доски
  useEffect(() => {
    loadInvestigationData();
  }, [boardId]);

  const loadInvestigationData = async () => {
    try {
      const investigationData = await apiService.getInvestigation(boardId);
      setInvestigation(investigationData);

      const boardState = await apiService.getBoardState(boardId);
      const boardData = boardState.board_data;
      
      setCards(boardData.cards || []);
      setTexts(boardData.texts || []);
      setImages(boardData.images || []);
      setConnections(boardData.connections || []);
    } catch (error) {
      console.error('Ошибка загрузки данных доски:', error);
    }
  };

  // 🔥 УЛУЧШЕННОЕ АВТОСОХРАНЕНИЕ
  const scheduleAutoSave = useCallback(() => {
    needsSaveRef.current = true;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (needsSaveRef.current) {
        try {
          const boardData = {
            cards,
            texts,
            images,
            connections
          };

          await apiService.saveBoardState(boardId, boardData);
          console.log('✅ Состояние доски сохранено');
          setLastSaveTime(Date.now());
          needsSaveRef.current = false;
        } catch (error) {
          console.error('❌ Ошибка сохранения состояния доски:', error);
        }
      }
    }, 1000); // Уменьшил время для более быстрого сохранения
  }, [boardId, cards, texts, images, connections]);

  // 🔥 ВЫЗЫВАЕМ АВТОСОХРАНЕНИЕ ПРИ ЛЮБОМ ИЗМЕНЕНИИ
  useEffect(() => {
    if (cards.length > 0 || texts.length > 0 || images.length > 0 || connections.length > 0) {
      scheduleAutoSave();
    }
  }, [cards, texts, images, connections, scheduleAutoSave]);

  // 🔥 ФУНКЦИЯ ДЛЯ ПРИНУДИТЕЛЬНОГО СОХРАНЕНИЯ
  const markForSave = useCallback(() => {
    needsSaveRef.current = true;
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // ФУНКЦИИ ДЛЯ РАБОТЫ С ЭЛЕМЕНТАМИ
  const getAllElements = useCallback(() => [
    ...cards.map(card => ({ ...card, type: 'card' })),
    ...texts.map(text => ({ ...text, type: 'text' })),
    ...images.map(img => ({ ...img, type: 'image' }))
  ], [cards, texts, images]);

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

  const findElementAtPoint = useCallback((x, y) => {
    const allElements = getAllElements();
    for (let i = allElements.length - 1; i >= 0; i--) {
      const element = allElements[i];
      const rect = getElementRect(element);
      if (x >= rect.x && x <= rect.x + rect.width && 
          y >= rect.y && y <= rect.y + rect.height) {
        return element;
      }
    }
    return null;
  }, [getAllElements]);

  // 🔥 УЛУЧШЕННАЯ ФУНКЦИЯ СОЗДАНИЯ СОЕДИНЕНИЯ
  const createConnection = (startElement, endElement) => {
    console.log('🔄 Создание соединения между:', startElement.id, 'и', endElement.id);
    
    if (!startElement || !endElement) {
      console.log('❌ Один из элементов не найден');
      return null;
    }

    if (startElement.id === endElement.id) {
      console.log('❌ Нельзя соединить элемент с самим собой');
      return null;
    }

    // Проверяем, не существует ли уже такое соединение
    const connectionExists = connections.some(conn => 
      (conn.start.elementId === startElement.id && conn.end.elementId === endElement.id) ||
      (conn.start.elementId === endElement.id && conn.end.elementId === startElement.id)
    );

    if (connectionExists) {
      console.log('❌ Соединение уже существует');
      return null;
    }

    const newConnection = {
      id: `conn-${Date.now()}`,
      start: { 
        elementId: startElement.id, 
        type: startElement.type
      },
      end: { 
        elementId: endElement.id, 
        type: endElement.type
      }
    };

    console.log('✅ СОЕДИНЕНИЕ СОЗДАНО!', newConnection);
    markForSave();
    return newConnection;
  };

  // ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ПОЗИЦИЙ СОЕДИНЕНИЙ
  const getConnectionPositions = useCallback((connection) => {
    const allElements = getAllElements();
    const startElement = allElements.find(el => el.id === connection.start.elementId);
    const endElement = allElements.find(el => el.id === connection.end.elementId);

    if (!startElement || !endElement) {
      return null;
    }

    return {
      start: getElementCenter(startElement),
      end: getElementCenter(endElement)
    };
  }, [getAllElements]);

  // 🔥 ИСПРАВЛЕННЫЙ ОБРАБОТЧИК КЛИКА ДЛЯ СОЕДИНЕНИЙ
  const handleConnectionClick = useCallback((e) => {
    if (!isConnecting) return;
    if (editingElementId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - canvasOffset.x;
    const clickY = e.clientY - rect.top - canvasOffset.y;

    console.log('🎯 Клик в режиме соединения:', { clickX, clickY });
    
    const element = findElementAtPoint(clickX, clickY);
    console.log('🔍 Найден элемент:', element ? `${element.type}:${element.id}` : 'null');

    if (!element) {
      console.log('❌ Клик по пустому месту, сбрасываем соединение');
      setConnectingStart(null);
      setTempConnectionEnd(null);
      setSelectedElements(new Set());
      return;
    }

    if (!connectingStart) {
      // ВЫБОР ПЕРВОГО ЭЛЕМЕНТА
      console.log('✅ Выбран ПЕРВЫЙ элемент:', element.id);
      setConnectingStart(element);
      setSelectedElements(new Set([element.id]));
    } else {
      // ВЫБОР ВТОРОГО ЭЛЕМЕНТА
      console.log('✅ Выбран ВТОРОЙ элемент:', element.id);
      
      const newConnection = createConnection(connectingStart, element);
      
      if (newConnection) {
        console.log('🔄 Добавляем соединение в массив...');
        setConnections(prev => {
          const newConnections = [...prev, newConnection];
          console.log('✅ Новый массив соединений:', newConnections);
          return newConnections;
        });
      }
      
      // СБРАСЫВАЕМ СОСТОЯНИЕ
      setConnectingStart(null);
      setTempConnectionEnd(null);
      setSelectedElements(new Set());
    }

    e.stopPropagation();
    e.preventDefault();
  }, [isConnecting, connectingStart, canvasOffset, editingElementId, findElementAtPoint, connections, createConnection]);

  // 🔥 ВОССТАНОВЛЕННЫЙ ОБРАБОТЧИК НАЖАТИЯ МЫШИ (как в работающей версии)
  const handleCanvasMouseDown = (e) => {
    console.log('🖱️ MouseDown - режим соединения:', isConnecting);
    
    if (editingElementId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - canvasOffset.x;
    const clickY = e.clientY - rect.top - canvasOffset.y;

    // ЕСЛИ РЕЖИМ СОЕДИНЕНИЯ - ВЫЗЫВАЕМ ОБРАБОТЧИК СОЕДИНЕНИЙ
    if (isConnecting) {
      handleConnectionClick(e);
      return;
    }

    if (isSelecting) {
      setSelectionStart({ x: clickX, y: clickY });
      if (!e.shiftKey) setSelectedElements(new Set());
    } else if (isMovingCanvas) {
      setIsDraggingCanvas(true);
    } else {
      const clickedElement = findElementAtPoint(clickX, clickY);
      
      if (clickedElement) {
        handleElementSelect(clickedElement.id, e.shiftKey);
        
        // 🔥 ВОССТАНОВИЛ: НАЧИНАЕМ ПЕРЕТАСКИВАНИЕ ДАЖЕ ЕСЛИ ЭЛЕМЕНТ УЖЕ ВЫБРАН
        setIsDraggingSelection(true);
        setDragStart({ 
          x: e.clientX, 
          y: e.clientY,
          initialPositions: getAllElements()
            .filter(el => selectedElements.has(el.id) || el.id === clickedElement.id)
            .map(el => ({ 
              id: el.id, 
              type: el.type, 
              position: { ...el.position },
              originalPosition: { ...el.position } // Сохраняем оригинальную позицию
            }))
        });
      } else {
        if (!e.shiftKey) setSelectedElements(new Set());
      }
    }
  };

  // 🔥 ВОССТАНОВЛЕННЫЙ ОБРАБОТЧИК ПЕРЕМЕЩЕНИЯ МЫШИ
  const handleCanvasMouseMove = useCallback((e) => {
    if (editingElementId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left - canvasOffset.x;
    const currentY = e.clientY - rect.top - canvasOffset.y;

    if (isDraggingCanvas) {
      setCanvasOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    } else if (isSelecting && selectionStart) {
      setSelectionRect({
        x: Math.min(selectionStart.x, currentX),
        y: Math.min(selectionStart.y, currentY),
        width: Math.abs(currentX - selectionStart.x),
        height: Math.abs(currentY - selectionStart.y)
      });
    } else if (isConnecting && connectingStart) {
      // ВРЕМЕННАЯ ЛИНИЯ СОЕДИНЕНИЯ
      const startPos = getElementCenter(connectingStart);
      setTempConnectionEnd({ 
        start: startPos,
        end: { x: currentX, y: currentY }
      });
    } else if (isDraggingSelection && dragStart && dragStart.initialPositions.length > 0) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // 🔥 ОБНОВЛЯЕМ ПОЗИЦИИ ВСЕХ ВЫБРАННЫХ ЭЛЕМЕНТОВ
      dragStart.initialPositions.forEach(({ id, type, originalPosition }) => {
        const newPosition = {
          x: originalPosition.x + deltaX,
          y: originalPosition.y + deltaY
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
  }, [
    isDraggingCanvas, isSelecting, selectionStart, isConnecting, 
    connectingStart, isDraggingSelection, canvasOffset, 
    dragStart, editingElementId, getAllElements
  ]);

  // 🔥 ВОССТАНОВЛЕННЫЙ ОБРАБОТЧИК ОТПУСКАНИЯ МЫШИ
  const handleCanvasMouseUp = useCallback(() => {
    if (isSelecting && selectionRect) {
      const allElements = getAllElements();
      const selected = new Set(selectedElements);
      
      allElements.forEach(element => {
        const elementRect = getElementRect(element);
        if (elementRect.x < selectionRect.x + selectionRect.width &&
            elementRect.x + elementRect.width > selectionRect.x &&
            elementRect.y < selectionRect.y + selectionRect.height &&
            elementRect.y + elementRect.height > selectionRect.y) {
          selected.add(element.id);
        }
      });
      
      setSelectedElements(selected);
    }

    setSelectionStart(null);
    setSelectionRect(null);
    setIsDraggingCanvas(false);
    setIsDraggingSelection(false);
    setDragStart(null);

    // 🔥 СОХРАНЯЕМ ПОСЛЕ ПЕРЕТАСКИВАНИЯ
    if (isDraggingSelection) {
      markForSave();
    }
  }, [isSelecting, selectionRect, selectedElements, getAllElements, isDraggingSelection, markForSave]);

  // ОБРАБОТЧИК КЛАВИАТУРЫ ДЛЯ УДАЛЕНИЯ
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedElements.size > 0) {
        handleDeleteSelected();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements]);

  // УДАЛЕНИЕ ВЫБРАННЫХ ЭЛЕМЕНТОВ
  const handleDeleteSelected = () => {
    if (selectedElements.size === 0) return;

    const allElements = getAllElements();
    const elementsToDelete = allElements.filter(el => selectedElements.has(el.id));

    elementsToDelete.forEach(element => {
      if (element.type === 'card') {
        setCards(prev => prev.filter(card => card.id !== element.id));
      } else if (element.type === 'text') {
        setTexts(prev => prev.filter(text => text.id !== element.id));
      } else if (element.type === 'image') {
        setImages(prev => prev.filter(img => img.id !== element.id));
      }
    });

    setSelectedElements(new Set());
    markForSave();
  };

  // УДАЛЕНИЕ СОЕДИНЕНИЙ ПРИ УДАЛЕНИИ ЭЛЕМЕНТОВ
  useEffect(() => {
    const allElementIds = new Set(getAllElements().map(el => el.id));
    setConnections(prev => prev.filter(conn => 
      allElementIds.has(conn.start.elementId) && allElementIds.has(conn.end.elementId)
    ));
  }, [cards, texts, images, getAllElements]);

  // TOOLBAR ACTIONS
  const handleSelectArea = () => {
    setIsSelecting(true);
    setIsMovingCanvas(false);
    setIsConnecting(false);
    setConnectingStart(null);
    setTempConnectionEnd(null);
    setSelectedElements(new Set());
  };

  const handleMoveCanvas = () => {
    setIsMovingCanvas(!isMovingCanvas);
    setIsSelecting(false);
    setIsConnecting(false);
    setConnectingStart(null);
    setTempConnectionEnd(null);
    setSelectedElements(new Set());
  };

  const handleAddCard = () => {
    const newCard = {
      id: `card-${Date.now()}`,
      title: 'Новая карточка',
      articleUrl: '',
      date: new Date().toISOString().split('T')[0],
      trustLevel: 'unknown',
      position: { x: 100, y: 100 }
    };
    setCards(prev => [...prev, newCard]);
    markForSave();
    resetTools();
  };

  const handleAddText = () => {
    const newText = {
      id: `text-${Date.now()}`,
      content: 'Новый текст',
      position: { x: 100, y: 150 }
    };
    setTexts(prev => [...prev, newText]);
    markForSave();
    resetTools();
  };

  const handleConnect = () => {
    const newConnectingState = !isConnecting;
    console.log('🔗 Переключение режима соединения:', newConnectingState);
    setIsConnecting(newConnectingState);
    setIsMovingCanvas(false);
    setIsSelecting(false);
    
    if (!newConnectingState) {
      setConnectingStart(null);
      setTempConnectionEnd(null);
      setSelectedElements(new Set());
    }
  };

  const handleAddPhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Временно используем локальный URL, можно добавить загрузку на сервер позже
          const newImage = {
            id: `image-${Date.now()}`,
            url: URL.createObjectURL(file),
            position: { x: 100, y: 200 }
          };
          setImages(prev => [...prev, newImage]);
          markForSave();
        } catch (error) {
          console.error('Ошибка загрузки изображения:', error);
        }
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
    setSelectedElements(new Set());
  };

  // 🔥 ОБРАБОТЧИКИ РЕДАКТИРОВАНИЯ ЭЛЕМЕНТОВ
  const handleCardEdit = (id, newData) => {
    if (newData._delete) {
      setCards(prev => prev.filter(card => card.id !== id));
      setEditingElementId(null);
      markForSave();
    } else {
      setCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...newData } : card
      ));
      if (!newData.isEditing) {
        setEditingElementId(null);
        markForSave();
      }
    }
  };

  const handleTextEdit = (id, newData) => {
    if (newData._delete) {
      setTexts(prev => prev.filter(text => text.id !== id));
      setEditingElementId(null);
      markForSave();
    } else {
      setTexts(prev => prev.map(text => 
        text.id === id ? { ...text, content: newData } : text
      ));
      if (typeof newData === 'string') {
        setEditingElementId(null);
        markForSave();
      }
    }
  };

  const handleImageEdit = (id, newData) => {
    if (newData._delete) {
      setImages(prev => prev.filter(img => img.id !== id));
      setEditingElementId(null);
      markForSave();
    } else {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, url: newData } : img
      ));
      markForSave();
    }
  };

  // ВЫДЕЛЕНИЕ ЭЛЕМЕНТОВ
  const handleElementSelect = (id, isMultiSelect = false) => {
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

  const handleElementEditStart = (id) => {
    setEditingElementId(id);
    setSelectedElements(new Set());
  };

  const handleElementEditEnd = () => {
    setEditingElementId(null);
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

  // EVENT LISTENERS
  useEffect(() => {
    document.addEventListener('mousemove', handleCanvasMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleCanvasMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  return (
    <div className="relative w-full h-screen bg-[#151516] overflow-hidden">
      <Navbar 
        currentBoardName={investigation?.title || `Доска ${boardId}`} 
        boards={[]}
      />
      
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
          width: '5000px',
          height: '5000px',
          backgroundColor: '#151516',
          cursor: getCanvasCursor()
        }}
        onMouseDown={handleCanvasMouseDown}
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

        {/* ВРЕМЕННАЯ ЛИНИЯ СОЕДИНЕНИЯ */}
        {isConnecting && connectingStart && tempConnectionEnd && (
          <ConnectionLine
            start={tempConnectionEnd.start}
            end={tempConnectionEnd.end}
            isTemp={true}
          />
        )}

        {/* ПОСТОЯННЫЕ СОЕДИНЕНИЯ */}
        {connections.map(connection => {
          const positions = getConnectionPositions(connection);
          if (!positions) return null;
          
          return (
            <ConnectionLine
              key={connection.id}
              start={positions.start}
              end={positions.end}
              isTemp={false}
            />
          );
        })}

        {/* CARDS */}
        {cards.map(card => (
          <div 
            key={card.id}
            className={isConnecting ? "pointer-events-none" : ""}
          >
            <CaseCard
              id={card.id}
              title={card.title}
              articleUrl={card.articleUrl}
              date={card.date}
              trustLevel={card.trustLevel}
              position={card.position} // 🔥 ИСПРАВЛЕНО: было initialPosition
              onEdit={handleCardEdit}
              onEditStart={handleElementEditStart}
              onEditEnd={handleElementEditEnd}
              isEditMode={true}
              isSelected={selectedElements.has(card.id)}
              onSelect={handleElementSelect}
              isEditing={editingElementId === card.id}
            />
          </div>
        ))}

        {/* TEXTS */}
        {texts.map(text => (
          <div 
            key={text.id}
            className={isConnecting ? "pointer-events-none" : ""}
          >
            <DraggableText
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
          </div>
        ))}

        {/* IMAGES */}
        {images.map(image => (
          <div 
            key={image.id}
            className={isConnecting ? "pointer-events-none" : ""}
          >
            <DraggableImage
              id={image.id}
              url={image.url}
              position={image.position}
              onEdit={handleImageEdit}
              isEditMode={true}
              isSelected={selectedElements.has(image.id)}
              onSelect={handleElementSelect}
            />
          </div>
        ))}
      </div>

      <Toolbar
        onSelectArea={handleSelectArea}
        onMoveCanvas={handleMoveCanvas}
        onAddCard={handleAddCard}
        onAddText={handleAddText}
        onConnect={handleConnect}
        onAddPhoto={handleAddPhoto}
        isMovingCanvas={isMovingCanvas}
      />

      <div className="fixed top-20 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm font-medium z-40">
        <div>Выбрано: <span className="text-blue-400">{selectedElements.size}</span></div>
        <div>Соединений: <span className="text-green-400">{connections.length}</span></div>
        {lastSaveTime > 0 && (
          <div className="text-gray-400 text-xs mt-1">
            Сохранено: {new Date(lastSaveTime).toLocaleTimeString()}
          </div>
        )}
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