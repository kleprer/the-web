// frontend/src/components/TimelineEvent.jsx
import React, { useState } from 'react';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

const TimelineEvent = ({ event, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: event.title,
    description: event.description,
    event_date: event.event_date.split('T')[0] // Format date for input
  });

  const handleSave = () => {
    onUpdate({
      title: editData.title,
      description: editData.description,
      event_date: editData.event_date
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: event.title,
      description: event.description,
      event_date: event.event_date.split('T')[0]
    });
    setIsEditing(false);
  };

  return (
    <div className="relative flex items-start group">
      {/* Timeline dot */}
      <div className="absolute -left-8 mt-2 w-4 h-4 bg-blue-500 rounded-full border-4 border-[#151516] z-10"></div>
      
      {/* Event card */}
      <div className="bg-gray-800 rounded-lg p-4 flex-1 border border-gray-700 hover:border-gray-600 transition-colors">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Название события"
            />
            
            <textarea
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              rows="3"
              placeholder="Описание события"
            />
            
            <input
              type="date"
              value={editData.event_date}
              onChange={(e) => setEditData(prev => ({ ...prev, event_date: e.target.value }))}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                <SaveOutlined />
                Сохранить
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
              >
                <CloseOutlined />
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-white">{event.title}</h3>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <EditOutlined />
                </button>
                <button
                  onClick={onDelete}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <DeleteOutlined />
                </button>
              </div>
            </div>
            
            <p className="text-gray-300">{event.description}</p>
            
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>{new Date(event.event_date).toLocaleDateString('ru-RU')}</span>
              <span>Создано: {new Date(event.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEvent;