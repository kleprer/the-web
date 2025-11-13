// components/NewEventForm.jsx
import React, { useState } from 'react';
import { PaperClipOutlined } from '@ant-design/icons';
import InputField from './InputField';
import ButtonOutline from './ButtonOutline';

const NewEventForm = ({ onAddEvent, onCancel }) => {
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    file: null
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.title) {
      alert('Заполните обязательные поля: дата и название');
      return;
    }

    const newEvent = {
      id: Date.now(),
      date: formData.date,
      title: formData.title,
      description: formData.description,
      file: formData.file
    };

    onAddEvent(newEvent);
    setFormData({ date: '', title: '', description: '', file: null });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] border border-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Добавить событие</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Дата */}
          <div>
            <label className="text-white text-sm mb-1 block">Дата *</label>
            <InputField
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              placeholder="Выберите дату"
              className="w-full"
            />
          </div>

          {/* Название */}
          <div>
            <label className="text-white text-sm mb-1 block">Название события *</label>
            <InputField
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Введите название события"
              className="w-full"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="text-white text-sm mb-1 block">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Введите описание события"
              className="w-full border-2 border-white rounded-[20px] bg-transparent text-white placeholder-white placeholder-opacity-60 px-4 py-3 text-[20px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 resize-none"
              rows="3"
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <ButtonOutline
              type="button"
              onClick={onCancel}
              className="flex-1"
            >
              Отмена
            </ButtonOutline>
            <button
              type="submit"
              className="flex-1 bg-white text-[#151516] rounded-[20px] px-4 py-2 text-[20px] font-semibold hover:bg-gray-200 transition-colors"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEventForm;