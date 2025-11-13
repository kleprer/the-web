// pages/Timeline.jsx
import React, { useState, useRef, useEffect } from 'react';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import TimelineEvent from '../components/TimelineEvent';
import CaseSelector from '../components/CaseSelector';
import NewEventForm from '../components/NewEventForm';

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [currentCase, setCurrentCase] = useState('Расследование коррупции в мэрии');
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const timelineRef = useRef(null);
  const dragStartRef = useRef(0);

  // Mock данные для событий
  const mockEvents = [
    {
      id: 1,
      date: '2024-01-15',
      title: 'Обнаружены финансовые нарушения',
      description: 'Выявлены несоответствия в отчетности'
    },
    {
      id: 2,
      date: '2024-01-20',
      title: 'Проведен допрос свидетеля',
      description: 'Свидетель подтвердил факты нарушений'
    },
    {
      id: 3,
      date: '2024-02-05',
      title: 'Получены документы из банка',
      description: 'Банковские выписки подтверждают транзакции'
    }
  ];

  // Загрузка событий при монтировании
  useEffect(() => {
    setEvents(mockEvents.sort((a, b) => new Date(a.date) - new Date(b.date)));
  }, []);

  // Drag handlers для горизонтального перемещения таймлайна
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

  // Добавление event listeners для drag
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

  // Добавление нового события
  const handleAddEvent = (newEvent) => {
    const updatedEvents = [...events, newEvent].sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(updatedEvents);
    setShowNewEventForm(false);
  };

  return (
    <div className="min-h-screen bg-[#151516] text-white">
      {/* Navbar */}
      <nav className="bg-transparent p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Левая часть - иконка пользователя и селектор кейсов */}
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <UserOutlined className="text-black text-lg" />
            </div>
            <CaseSelector 
              currentCase={currentCase} 
              onCaseChange={setCurrentCase} 
            />
          </div>

          {/* Правая часть - название и кнопка добавления */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="font-comorant-sc font-semibold text-2xl text-white leading-none">
                ПАУТИНА
              </p>
              <p className="font-inter font-light text-sm text-white leading-none mt-1">
                ассистент журналиста
              </p>
            </div>
            <img src="/logo.svg" alt="Логотип" className="h-10 w-10" />
          </div>
        </div>
      </nav>

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
          className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"
          style={{
            transform: `translateX(${timelinePosition}px) translateY(-50%)`,
            minWidth: '2000px' // Минимальная ширина для бесконечности
          }}
        >
          {/* События на таймлайне */}
          {events.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              position={index * 200} // Равномерное распределение
              totalEvents={events.length}
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
    </div>
  );
};

export default Timeline;