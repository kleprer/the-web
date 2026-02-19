import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { EmptyTimelineProps } from '../types/props';

const EmptyTimeline: React.FC<EmptyTimelineProps> = ({ onAddEvent }) => {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="text-gray-400 mb-4">
          <svg className="w-24 h-24 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Таймлайн пуст</h3>
        <p className="text-gray-400 mb-6">Добавьте первое событие, чтобы начать работу с таймлайном</p>
        <button
          onClick={onAddEvent}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusOutlined />
          <span>Добавить первое событие</span>
        </button>
      </div>
    </div>
  );
};

export default EmptyTimeline;