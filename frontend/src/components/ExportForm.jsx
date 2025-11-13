// components/ExportForm.jsx
import React, { useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import InputField from './InputField';
import ButtonOutline from './ButtonOutline';

const ExportForm = ({ evidences, onClose, onExport }) => {
  const [selectedEvidences, setSelectedEvidences] = useState(
    evidences.reduce((acc, evidence) => {
      acc[evidence.id] = {
        selected: false,
        description: ''
      };
      return acc;
    }, {})
  );

  const handleSelectAll = (select) => {
    const updated = { ...selectedEvidences };
    Object.keys(updated).forEach(id => {
      updated[id].selected = select;
    });
    setSelectedEvidences(updated);
  };

  const handleEvidenceSelect = (id, selected) => {
    setSelectedEvidences(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected
      }
    }));
  };

  const handleDescriptionChange = (id, description) => {
    setSelectedEvidences(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        description
      }
    }));
  };

  const handleExport = () => {
    const exportData = Object.entries(selectedEvidences)
      .filter(([id, data]) => data.selected)
      .map(([id, data]) => {
        const evidence = evidences.find(e => e.id === parseInt(id));
        return {
          ...evidence,
          description: data.description
        };
      });

    if (exportData.length === 0) {
      alert('Выберите хотя бы один файл для экспорта');
      return;
    }

    onExport(exportData);
  };

  const selectedCount = Object.values(selectedEvidences).filter(data => data.selected).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] border border-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b border-white">
          <h2 className="text-xl font-semibold text-white">Экспорт в PDF</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <CloseOutlined className="text-lg" />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white">Выберите файлы ({selectedCount} выбрано)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="text-white text-sm hover:text-gray-300 transition-colors"
                >
                  Выбрать все
                </button>
                <span className="text-white">|</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-white text-sm hover:text-gray-300 transition-colors"
                >
                  Снять выделение
                </button>
              </div>
            </div>

            {/* Список файлов */}
            <div className="space-y-3 max-h-96 overflow-auto">
              {evidences.map(evidence => (
                <div key={evidence.id} className="flex items-center gap-4 p-3 bg-[#3a3a3a] rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedEvidences[evidence.id]?.selected || false}
                    onChange={(e) => handleEvidenceSelect(evidence.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {evidence.name}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {evidence.type.toUpperCase()} • {evidence.size}
                    </div>
                  </div>

                  {selectedEvidences[evidence.id]?.selected && (
                    <div className="flex-1 min-w-0">
                      <InputField
                        placeholder="Описание файла"
                        value={selectedEvidences[evidence.id]?.description || ''}
                        onChange={(e) => handleDescriptionChange(evidence.id, e.target.value)}
                        className="w-full text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 p-6 border-t border-white">
          <ButtonOutline
            onClick={onClose}
            className="flex-1"
          >
            Отмена
          </ButtonOutline>
          <button
            onClick={handleExport}
            className="flex-1 bg-white text-[#151516] rounded-[20px] px-4 py-2 text-[20px] font-semibold hover:bg-gray-200 transition-colors"
          >
            Экспорт
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportForm;