// components/CaseSelector.jsx
import React, { useState } from 'react';
import { DownOutlined } from '@ant-design/icons';

const CaseSelector = ({ currentCase, onCaseChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mock данные кейсов
  const cases = [
    'Расследование коррупции в мэрии',
    'Дело о незаконной застройке',
    'Расследование финансовых махинаций',
    'Коррупция в образовании'
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white text-lg font-semibold hover:text-gray-300 transition-colors"
      >
        {currentCase}
        <DownOutlined className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#2a2a2a] border border-white rounded-lg shadow-lg z-50 min-w-64">
          {cases.map((caseItem, index) => (
            <button
              key={index}
              onClick={() => {
                onCaseChange(caseItem);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-white hover:bg-[#3a3a3a] transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {caseItem}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseSelector;