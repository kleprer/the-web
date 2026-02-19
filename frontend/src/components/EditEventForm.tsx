import React, { useState } from 'react';
import InputField from './InputField';
import ButtonOutline from './ButtonOutline';
import { EditEventFormProps } from '../types/props';

interface FormData {
  title: string;
  description: string;
  event_date: string;
}

const EditEventForm: React.FC<EditEventFormProps> = ({ event, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    title: event.title,
    description: event.description || '',
    event_date: event.event_date.split('T')[0]
  });

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!formData.event_date || !formData.title) {
      alert('Заполните обязательные поля: дата и название');
      return;
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_date: new Date(formData.event_date + 'T12:00:00').toISOString()
      };

      await onUpdate(event.id, eventData);
    } catch (error) {
      console.error('Ошибка при обновлении события:', error);
      alert('Ошибка при обновлении события');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] border border-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Редактировать событие</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Дата */}
          <div>
            <label className="text-white text-sm mb-1 block">Дата *</label>
            <InputField
              type="date"
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
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
              rows={3}
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
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventForm;