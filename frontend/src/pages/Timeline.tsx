import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import TimelineEvent from '../components/TimelineEvent';
import NewEventForm from '../components/NewEventForm';
import EditEventForm from '../components/EditEventForm';
import Navbar from '../components/Navbar';
import { apiService } from '../services/api';
import { TimelineEvent as TimelineEventType, Investigation } from '../types/index';

const Timeline: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [events, setEvents] = useState<TimelineEventType[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [showNewEventForm, setShowNewEventForm] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEventType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [timelinePosition, setTimelinePosition] = useState<number>(0);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState<boolean>(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number>(0);

  const loadInvestigationData = useCallback(async (): Promise<void> => {
    if (!boardId) return;
    try {
      const data = await apiService.getInvestigation(parseInt(boardId));
      setInvestigation(data);
    } catch (error) {
      console.error('Ошибка загрузки расследования:', error);
    }
  }, [boardId]);

  const loadTimelineEvents = useCallback(async (): Promise<void> => {
    if (!boardId) return;
    try {
      const eventsData = await apiService.getTimelineEvents(parseInt(boardId));
      setEvents(eventsData);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (boardId) {
      loadInvestigationData();
      loadTimelineEvents();
    }
  }, [boardId, loadInvestigationData, loadTimelineEvents]);

  const handleAddEvent = async (newEventData: any): Promise<void> => {
    try {
      console.log('🎯 Создание события с данными:', newEventData);
      const createdEvent = await apiService.createTimelineEvent(parseInt(boardId!), newEventData);
      console.log(' Событие создано:', createdEvent);
      
      setEvents(prev => [...prev, createdEvent].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
      setShowNewEventForm(false);
    } catch (error) {
      console.error(' Ошибка создания события:', error);
      alert('Ошибка создания события: ' + (error as Error).message);
    }
  };

  const handleUpdateEvent = async (eventId: number, eventData: any): Promise<void> => {
    try {
      await apiService.updateTimelineEvent(eventId, eventData);
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? { ...event, ...eventData } : event
        ).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      );
      setEditingEvent(null);
    } catch (error) {
      console.error('Ошибка обновления события:', error);
    }
  };

  const handleDeleteEvent = async (eventId: number): Promise<void> => {
    try {
      await apiService.deleteTimelineEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Ошибка удаления события:', error);
    }
  };

  const handleEditEvent = (event: TimelineEventType): void => {
    setEditingEvent(event);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent): void => {
    setIsDraggingTimeline(true);
    dragStartRef.current = e.clientX - timelinePosition;
    e.preventDefault();
  };

  const handleTimelineMouseMove = useCallback((e: MouseEvent): void => {
    if (!isDraggingTimeline) return;
    setTimelinePosition(e.clientX - dragStartRef.current);
  }, [isDraggingTimeline]);

  const handleTimelineMouseUp = (): void => {
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
  }, [isDraggingTimeline, handleTimelineMouseMove]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#151516] text-white">
        <Navbar currentBoardName={investigation?.title} />
        <div className="container mx-auto px-8 mt-6 text-center">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#151516] text-white">
      <Navbar currentBoardName={investigation?.title} />

      <div className="container mx-auto px-8 mt-6">
        <button
          onClick={() => setShowNewEventForm(true)}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors mb-8"
        >
          <PlusOutlined className="text-lg" />
          <span className="text-lg">Добавить событие</span>
        </button>
      </div>

      <div 
        className="relative h-96 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleTimelineMouseDown}
      >
        <div
          ref={timelineRef}
          className="absolute top-1/2 left-1/3 right-0 h-0.5 bg-white transform -translate-y-1/2"
          style={{
            transform: `translateX(${timelinePosition}px) translateY(-50%)`,
            minWidth: Math.max(2000, events.length * 300)
          }}
        >
          {events.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              position={index * 300}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      </div>

      {showNewEventForm && (
        <NewEventForm
          onAddEvent={handleAddEvent}
          onCancel={() => setShowNewEventForm(false)}
        />
      )}

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