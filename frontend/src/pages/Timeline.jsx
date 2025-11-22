// frontend/src/pages/Timeline.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import TimelineEvent from '../components/TimelineEvent';
import NewEventForm from '../components/NewEventForm';
import Navbar from '../components/Navbar';
import { apiService } from '../services/api';

const Timeline = () => {
  const { boardId } = useParams();
  const [events, setEvents] = useState([]);
  const [investigation, setInvestigation] = useState(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const createdEvent = await apiService.createTimelineEvent(boardId, newEventData);
      setEvents(prev => [...prev, createdEvent].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
      setShowNewEventForm(false);
    } catch (error) {
      console.error('Ошибка создания события:', error);
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
      <Navbar currentBoardName={investigation?.title} />

      <div className="container mx-auto px-8 mt-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">
            Таймлайн - {investigation?.title}
          </h1>
          
          <button
            onClick={() => setShowNewEventForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusOutlined className="text-lg" />
            <span className="text-lg">Добавить событие</span>
          </button>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white bg-opacity-30"></div>
          
          {/* Events */}
          <div className="space-y-8 ml-16">
            {events.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg mb-2">Нет событий в таймлайне</p>
                <p className="text-sm">Добавьте первое событие чтобы начать</p>
              </div>
            ) : (
              events.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  onUpdate={(updatedData) => handleUpdateEvent(event.id, updatedData)}
                  onDelete={() => handleDeleteEvent(event.id)}
                  position={index}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Форма добавления события */}
      {showNewEventForm && (
        <NewEventForm
          onAddEvent={handleAddEvent}
          onCancel={() => setShowNewEventForm(false)}
        />
      )}
    </div>
  );
};

export default Timeline;