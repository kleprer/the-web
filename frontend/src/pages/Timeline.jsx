import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import TimelineEvent from '../components/TimelineEvent';
import NewEventForm from '../components/NewEventForm';
import EditEventForm from '../components/EditEventForm';
import Navbar from '../components/Navbar';
import { apiService } from '../services/api';

const Timeline = () => {
  const { boardId } = useParams();
  const [events, setEvents] = useState([]);
  const [investigation, setInvestigation] = useState(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Для горизонтального скролла
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const timelineRef = useRef(null);
  const dragStartRef = useRef(0);

  useEffect(() => {
    if (boardId) {
      loadInvestigationData();
      loadTimelineEvents();
    }
  }, [boardId]);

  const loadInvestigationData = async () => {
    try {
      const data = await apiService.getInvestigation(boardId);
      setInvestigation(data);
    } catch (error) {
      console.error('Ошибка загрузки расследования:', error);
    }
  };

  const loadTimelineEvents = async () => {
    try {
      const eventsData = await apiService.getTimelineEvents(boardId);
      setEvents(eventsData);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (newEventData) => {
    try {
      console.log('🎯 Создание события с данными:', newEventData);
      const createdEvent = await apiService.createTimelineEvent(boardId, newEventData);
      console.log(' Событие создано:', createdEvent);
      
      setEvents(prev => [...prev, createdEvent].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
      setShowNewEventForm(false);
    } catch (error) {
      console.error(' Ошибка создания события:', error);
      alert('Ошибка создания события: ' + error.message);
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      await apiService.updateTimelineEvent(eventId, eventData);
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? { ...event, ...eventData } : event
        ).sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      );
      setEditingEvent(null);
    } catch (error) {
      console.error('Ошибка обновления события:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await apiService.deleteTimelineEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Ошибка удаления события:', error);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
  };

  // Drag логика для горизонтального скролла
  const handleTimelineMouseDown = (e) => {
    setIsDraggingTimeline(true);
    dragStartRef.current = e.clientX - timelinePosition;
    e.preventDefault();
  };

  const handleTimelineMouseMove = (e) => {
    if (!isDraggingTimeline) return;
    setTimelinePosition(e.clientX - dragStartRef.current);
  };

  const handleTimelineMouseUp = () => {
    setIsDraggingTimeline(false);
  };

  useEffect(() => {
    if (isDraggingTimeline) {
      document.addEventListener('mousemove', handleTimelineMouseMove);
      document.addEventListener('mouseup', handleTimelineMouseUp);
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleTimelineMouseMove);
      document.removeEventListener('mouseup', handleTimelineMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDraggingTimeline]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#151516] text-white">
        <Navbar />
        <div className="container mx-auto px-8 mt-6 text-center">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#151516] text-white">
      <Navbar />

      {/* Кнопка добавления события */}
      <div className="container mx-auto px-8 mt-6">
        <button
          onClick={() => setShowNewEventForm(true)}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors mb-8"
        >
          <PlusOutlined className="text-lg" />
          <span className="text-lg">Добавить событие</span>
        </button>
      </div>

      {/* Timeline Container */}
      <div 
        className="relative h-96 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleTimelineMouseDown}
      >
        {/* Бесконечная горизонтальная линия */}
        <div
          ref={timelineRef}
          className="absolute top-1/2 left-1/3 right-0 h-0.5 bg-white transform -translate-y-1/2"
          style={{
            transform: `translateX(${timelinePosition}px) translateY(-50%)`,
            minWidth: Math.max(2000, events.length * 300) // Динамическая ширина
          }}
        >
          {/* События на таймлайне */}
          {events.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              position={index * 300} // Увеличили расстояние
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      </div>

      {/* Форма добавления события */}
      {showNewEventForm && (
        <NewEventForm
          onAddEvent={handleAddEvent}
          onCancel={() => setShowNewEventForm(false)}
        />
      )}

      {/* Форма редактирования события */}
      {editingEvent && (
        <EditEventForm
          event={editingEvent}
          onUpdate={handleUpdateEvent}
          onCancel={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};

export default Timeline;