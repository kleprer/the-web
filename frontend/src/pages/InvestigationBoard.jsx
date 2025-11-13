import React from 'react';
import CaseCard from '../components/CaseCard';

const InvestigationBoard = () => {
  return (
    <div className="relative w-full h-screen bg-[#151516] p-8 overflow-hidden">
      {/* УБРАЛ style prop - позиция теперь управляется через state в компоненте */}
      <CaseCard
        title="Подтвержденные факты"
        articleUrl="https://example.com/article2"
        date="2024-01-10"
        trustLevel="high"
      />

      <CaseCard
        title="Сомнительный источник"
        articleUrl="https://example.com/article3"
        date="2024-01-05"
        trustLevel="low"
      />
    </div>
  );
};

export default InvestigationBoard;