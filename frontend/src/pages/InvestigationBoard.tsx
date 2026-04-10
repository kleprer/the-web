import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CaseCard from '../components/CaseCard';
import Toolbar from '../components/Toolbar';
import DraggableText from '../components/DraggableText';
import DraggableImage from '../components/DraggableImage';
import ConnectionLine from '../components/ConnectionLine';
import Navbar from '../components/Navbar';
import { apiService } from '../services/api';
import { Card, Text, Image, Connection, Investigation, BoardState } from '../types/index';
import SEOMeta from '../components/SEOMeta';
import ExternalNews from '../components/ExternalNews'

const InvestigationBoard: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [texts, setTexts] = useState<Text[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [isMovingCanvas, setIsMovingCanvas] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [isDraggingSelection, setIsDraggingSelection] = useState<boolean>(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [connectingStart, setConnectingStart] = useState<{ id: string; type: string; position: { x: number; y: number } } | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [dragStart, setDragStart] = useState<{ 
    x: number; 
    y: number; 
    initialPositions: Array<{ id: string; type: string; position: { x: number; y: number }; originalPosition: { x: number; y: number } }> 
  } | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const needsSaveRef = useRef<boolean>(false);

  // загрузка данных доски
  const loadInvestigationData = useCallback(async (): Promise<void> => {
    if (!boardId) return;
    try {
      const investigationData = await apiService.getInvestigation(parseInt(boardId));
      setInvestigation(investigationData);

      const boardState = await apiService.getBoardState(parseInt(boardId));
      const boardData = boardState.board_data as BoardState;
      
      setCards(boardData.cards || []);
      setTexts(boardData.texts || []);
      setImages(boardData.images || []);
      setConnections(boardData.connections || []);
    } catch (error) {
      console.error('ошибка загрузки данных доски:', error);
    }
  }, [boardId]);

  useEffect(() => {
    loadInvestigationData();
  }, [loadInvestigationData]);

  const scheduleAutoSave = useCallback((): void => {
    needsSaveRef.current = true;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (needsSaveRef.current) {
        try {
          const boardData: BoardState = {
            cards,
            texts,
            images,
            connections
          };

          await apiService.saveBoardState(parseInt(boardId!), boardData);
          console.log('состояние доски сохранено');
          setLastSaveTime(Date.now());
          needsSaveRef.current = false;
        } catch (error) {
          console.error('ошибка сохранения состояния доски:', error);
        }
      }
    }, 1000); 
  }, [boardId, cards, texts, images, connections]);

  useEffect(() => {
    if (cards.length > 0 || texts.length > 0 || images.length > 0 || connections.length > 0) {
      scheduleAutoSave();
    }
  }, [cards, texts, images, connections, scheduleAutoSave]);

  const markForSave = useCallback((): void => {
    needsSaveRef.current = true;
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const getAllElements = useCallback((): Array<{ id: string; type: string; position: { x: number; y: number } }> => [
    ...cards.map(card => ({ ...card, type: 'card' as const })),
    ...texts.map(text => ({ ...text, type: 'text' as const })),
    ...images.map(img => ({ ...img, type: 'image' as const }))
  ], [cards, texts, images]);

  const getElementRect = (element: any): { x: number; y: number; width: number; height: number } => {
    const dimensions: { [key: string]: { width: number; height: number } } = {
      'card': { width: 320, height: 192 },
      'text': { width: 200, height: 100 },
      'image': { width: 200, height: 150 }
    };
    
    return {
      x: element.position.x,
      y: element.position.y,
      width: dimensions[element.type]?.width || 200,
      height: dimensions[element.type]?.height || 150
    };
  };

  const getElementCenter = useCallback((element: any): { x: number; y: number } => {
    const rect = getElementRect(element);
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }, []);

  const findElementAtPoint = useCallback((x: number, y: number): any => {
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

  const createConnection = (startElement: any, endElement: any): Connection | null => {
    console.log('🔄 создание соединения между:', startElement.id, 'и', endElement.id);
    
    if (!startElement || !endElement) {
      console.log('один из элементов не найден');
      return null;
    }

    if (startElement.id === endElement.id) {
      console.log('нельзя соединить элемент с самим собой');
      return null;
    }

    const connectionExists = connections.some(conn => 
      (conn.start.elementId === startElement.id && conn.end.elementId === endElement.id) ||
      (conn.start.elementId === endElement.id && conn.end.elementId === startElement.id)
    );

    if (connectionExists) {
      console.log('соединение уже существует');
      return null;
    }

    const newConnection: Connection = {
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

    console.log('✅ соединение создано!', newConnection);
    markForSave();
    return newConnection;
  };

  const getConnectionPositions = useCallback((connection: Connection): { start: { x: number; y: number }; end: { x: number; y: number } } | null => {
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
  }, [getAllElements, getElementCenter]);

  const handleConnectionClick = useCallback((e: React.MouseEvent): void => {
    if (!isConnecting) return;
    if (editingElementId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left - canvasOffset.x;
    const clickY = e.clientY - rect.top - canvasOffset.y;

    console.log('клик в режиме соединения:', { clickX, clickY });
    
    const element = findElementAtPoint(clickX, clickY);
    console.log('найден элемент:', element ? `${element.type}:${element.id}` : 'null');

    if (!element) {
      console.log('клик по пустому месту, сбрасываем соединение');
      setConnectingStart(null);
      setTempConnectionEnd(null);
      setSelectedElements(new Set());
      return;
    }

    if (!connectingStart) {
      console.log('выбран первый элемент:', element.id);
      setConnectingStart({
        id: element.id,
        type: element.type,
        position: getElementCenter(element)
      });
      setSelectedElements(new Set([element.id]));
    } else {
      console.log('выбран второй элемент:', element.id);
      
      const newConnection = createConnection(
        { id: connectingStart.id, type: connectingStart.type },
        element
      );
      
      if (newConnection) {
        console.log('добавляем соединение в массив...');
        setConnections(prev => {
          const newConnections = [...prev, newConnection];
          console.log('новый массив соединений:', newConnections);
          return newConnections;
        });
      }
      
      setConnectingStart(null);
      setTempConnectionEnd(null);
      setSelectedElements(new Set());
    }

    e.stopPropagation();
    e.preventDefault();
  }, [isConnecting, connectingStart, canvasOffset, editingElementId, findElementAtPoint, getElementCenter, createConnection]);

  const handleCanvasMouseDown = (e: React.MouseEvent): void => {
    console.log('🖱️ mousedown - режим соединения:', isConnecting);
    
    if (editingElementId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left - canvasOffset.x;
    const clickY = e.clientY - rect.top - canvasOffset.y;

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
        
        setIsDraggingSelection(true);
        setDragStart({ 
          x: e.clientX, 
          y: e.clientY,
          initialPositions: getAllElements()
            .filter(el => selectedElements.has(el.id) || el.id === clickedElement.id)
            .map(el => ({ 
              id: el.id, 
              type: el.type as 'card' | 'text' | 'image', 
              position: { ...el.position },
              originalPosition: { ...el.position } 
            }))
        });
      } else {
        if (!e.shiftKey) setSelectedElements(new Set());
      }
    }
  };

  const handleCanvasMouseMove = useCallback((e: MouseEvent): void => {
    if (editingElementId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

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
      setTempConnectionEnd({ 
        start: connectingStart.position,
        end: { x: currentX, y: currentY }
      });
    } else if (isDraggingSelection && dragStart && dragStart.initialPositions.length > 0) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

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
    dragStart, editingElementId
  ]);

  const handleCanvasMouseUp = useCallback((): void => {
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

    if (isDraggingSelection) {
      markForSave();
    }
  }, [isSelecting, selectionRect, selectedElements, getAllElements, isDraggingSelection, markForSave]);

  useEffect(() => {
    document.addEventListener('mousemove', handleCanvasMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleCanvasMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Delete' && selectedElements.size > 0) {
        handleDeleteSelected();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements]);

  const handleDeleteSelected = useCallback((): void => {
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
  }, [selectedElements, getAllElements, markForSave]);

  useEffect(() => {
    const allElementIds = new Set(getAllElements().map(el => el.id));
    setConnections(prev => prev.filter(conn => 
      allElementIds.has(conn.start.elementId) && allElementIds.has(conn.end.elementId)
    ));
  }, [cards, texts, images, getAllElements]);

  const handleSelectArea = (): void => {
    setIsSelecting(true);
    setIsMovingCanvas(false);
    setIsConnecting(false);
    setConnectingStart(null);
    setTempConnectionEnd(null);
    setSelectedElements(new Set());
  };

  const handleMoveCanvas = (): void => {
    setIsMovingCanvas(!isMovingCanvas);
    setIsSelecting(false);
    setIsConnecting(false);
    setConnectingStart(null);
    setTempConnectionEnd(null);
    setSelectedElements(new Set());
  };

  const handleAddCard = (): void => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: 'новая карточка',
      articleUrl: '',
      date: new Date().toISOString().split('T')[0],
      trustLevel: 'unknown',
      position: { x: 100, y: 100 }
    };
    setCards(prev => [...prev, newCard]);
    markForSave();
    resetTools();
  };

  const handleAddText = (): void => {
    const newText: Text = {
      id: `text-${Date.now()}`,
      content: 'новый текст',
      position: { x: 100, y: 150 }
    };
    setTexts(prev => [...prev, newText]);
    markForSave();
    resetTools();
  };

  const handleConnect = (): void => {
    const newConnectingState = !isConnecting;
    console.log('🔗 переключение режима соединения:', newConnectingState);
    setIsConnecting(newConnectingState);
    setIsMovingCanvas(false);
    setIsSelecting(false);
    
    if (!newConnectingState) {
      setConnectingStart(null);
      setTempConnectionEnd(null);
      setSelectedElements(new Set());
    }
  };

  const handleAddPhoto = async (): Promise<void> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          const newImage: Image = {
            id: `image-${Date.now()}`,
            url: URL.createObjectURL(file),
            position: { x: 100, y: 200 }
          };
          setImages(prev => [...prev, newImage]);
          markForSave();
        } catch (error) {
          console.error('ошибка загрузки изображения:', error);
        }
      }
    };
    input.click();
    resetTools();
  };

  const resetTools = (): void => {
    setIsMovingCanvas(false);
    setIsSelecting(false);
    setIsConnecting(false);
    setConnectingStart(null);
    setTempConnectionEnd(null);
    setSelectedElements(new Set());
  };

  const handleCardEdit = (id: string, newData: any): void => {
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

  const handleTextEdit = (id: string, newData: any): void => {
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

  const handleImageEdit = (id: string, newData: any): void => {
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

  const handleElementSelect = (id: string, isMultiSelect: boolean = false): void => {
    if (editingElementId === id) return;

    setSelectedElements(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  const handleElementEditStart = (id: string): void => {
    setEditingElementId(id);
    setSelectedElements(new Set());
  };

  const handleElementEditEnd = (): void => {
    setEditingElementId(null);
  };

  const getCanvasCursor = (): string => {
    if (editingElementId) return 'default';
    if (isMovingCanvas) return isDraggingCanvas ? 'grabbing' : 'grab';
    if (isSelecting) return 'crosshair';
    if (isConnecting) return 'crosshair';
    if (isDraggingSelection && selectedElements.size > 0) return 'grabbing';
    if (selectedElements.size > 0) return 'move';
    return 'default';
  };

  // seo-метаданные для страницы
  const pageTitle = investigation?.title || 'доска расследования';
  const pageDescription = investigation?.description || 'визуальная доска для связей между фактами, событиями и доказательствами в журналистском расследовании';

  return (
    <>
      <SEOMeta
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={`/board/${boardId}`}
        type="article"
        publishedTime={investigation?.created_at}
      />

      <div className="relative w-full h-screen bg-[#151516] overflow-hidden">
        <Navbar 
          currentBoardName={investigation?.title || `доска ${boardId}`} 
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

          {isConnecting && connectingStart && tempConnectionEnd && (
            <ConnectionLine
              start={tempConnectionEnd.start}
              end={tempConnectionEnd.end}
              isTemp={true}
            />
          )}

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
                position={card.position}
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
                isConnectingMode={isConnecting}
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
          <div>выбрано: <span className="text-blue-400">{selectedElements.size}</span></div>
          <div>соединений: <span className="text-green-400">{connections.length}</span></div>
          {lastSaveTime > 0 && (
            <div className="text-gray-400 text-xs mt-1">
              сохранено: {new Date(lastSaveTime).toLocaleTimeString()}
            </div>
          )}
          {editingElementId && <div className="text-orange-400">• редактирование элемента</div>}
          {isSelecting && <div className="text-green-400">• выделение</div>}
          {isMovingCanvas && <div className="text-yellow-400">• перемещение канваса</div>}
          {isConnecting && (
            <div className="text-purple-400">
              • соединение - {connectingStart ? 'выберите второй элемент' : 'выберите первый элемент'}
            </div>
          )}
          {selectedElements.size > 0 && (
            <div className="text-gray-400 text-xs mt-1">
              перетаскивайте или используйте стрелки • delete для удаления
            </div>
          )}
        </div>

        {/* панель с внешними новостями (интеграция стороннего api) */}
        <div className="fixed bottom-20 right-4 w-80 z-40">
          <ExternalNews investigationTitle={investigation?.title} />
        </div>
      </div>
    </>
  );
};

export default InvestigationBoard;