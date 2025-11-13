// pages/EvidenceStorage.jsx
import React, { useState } from 'react';
import { UserOutlined, ExportOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import EvidenceCard from '../components/EvidenceCard';
import ExportForm from '../components/ExportForm';
import CaseSelector from '../components/CaseSelector';

const EvidenceStorage = () => {
  const [currentCase, setCurrentCase] = useState('Расследование коррупции в мэрии');
  const [showExportForm, setShowExportForm] = useState(false);
  const [evidences, setEvidences] = useState([]);

  // Mock данные доказательств
  const mockEvidences = [
    { id: 1, name: 'bank_statement.pdf', type: 'pdf', size: '2.4 MB' },
    { id: 2, name: 'witness_interview.mp3', type: 'audio', size: '15.7 MB' },
    { id: 3, name: 'corruption_photo.jpg', type: 'image', size: '3.2 MB' },
    { id: 4, name: 'financial_report.xlsx', type: 'excel', size: '1.1 MB' },
    { id: 5, name: 'email_correspondence.pdf', type: 'pdf', size: '4.8 MB' },
    { id: 6, name: 'surveillance_video.mp4', type: 'video', size: '45.2 MB' },
    { id: 7, name: 'contract_scan.pdf', type: 'pdf', size: '3.7 MB' },
    { id: 8, name: 'audio_notes.m4a', type: 'audio', size: '8.9 MB' },
  ];

  // Загрузка данных при монтировании
  React.useEffect(() => {
    setEvidences(mockEvidences);
  }, []);

  const handleCreateFolder = () => {
    const folderName = prompt('Введите название папки:');
    if (folderName) {
      const newFolder = {
        id: Date.now(),
        name: folderName,
        type: 'folder',
        size: '0 B'
      };
      setEvidences(prev => [...prev, newFolder]);
    }
  };

  const handleAddFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const newFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: getFileType(file.name),
          size: formatFileSize(file.size),
          file: file
        };
        setEvidences(prev => [...prev, newFile]);
      });
    };
    input.click();
  };

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) return 'audio';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
    if (['docx', 'doc'].includes(ext)) return 'word';
    return 'file';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen flex">
      {/* Левая панель - навбар */}
      <div className="w-80 bg-[#151516] text-white flex flex-col">
        {/* Навбар */}
        <nav className="p-4">
          <div className="flex justify-between items-center mb-8">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <UserOutlined className="text-black text-lg" />
            </div>
            <div className="flex flex-col items-end">
              <p className="font-comorant-sc font-semibold text-2xl leading-none">
                ПАУТИНА
              </p>
              <p className="font-inter font-light text-sm leading-none mt-1">
                ассистент журналиста
              </p>
            </div>
          </div>

          {/* Селектор кейсов */}
          <CaseSelector 
            currentCase={currentCase} 
            onCaseChange={setCurrentCase} 
          />
        </nav>

        {/* Кнопки создания папки и добавления файла */}
        <div className="mt-auto p-4 space-y-3">
          <button
            onClick={handleCreateFolder}
            className="w-full flex items-center gap-2 text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
          >
            <FolderAddOutlined />
            <span>Создать папку</span>
          </button>
          <button
            onClick={handleAddFile}
            className="w-full flex items-center gap-2 text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
          >
            <FileAddOutlined />
            <span>Добавить файл</span>
          </button>
        </div>
      </div>

      {/* Основная область - доказательства */}
      <div className="flex-1 bg-[#D6D6D6] flex flex-col">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-400">
          <h1 className="text-2xl font-semibold text-gray-800">
            Хранилище доказательств - {currentCase}
          </h1>
        </div>

        {/* Сетка доказательств */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {evidences.map(evidence => (
              <EvidenceCard
                key={evidence.id}
                name={evidence.name}
                type={evidence.type}
                size={evidence.size}
              />
            ))}
          </div>
        </div>

        {/* Кнопка экспорта */}
        <div className="p-6 border-t border-gray-400">
          <button
            onClick={() => setShowExportForm(true)}
            className="flex items-center gap-2 bg-[#151516] text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors ml-auto"
          >
            <ExportOutlined />
            <span>Экспортировать в PDF</span>
          </button>
        </div>
      </div>

      {/* Форма экспорта */}
      {showExportForm && (
        <ExportForm
          evidences={evidences}
          onClose={() => setShowExportForm(false)}
          onExport={(selectedEvidences) => {
            console.log('Экспорт доказательств:', selectedEvidences);
            setShowExportForm(false);
          }}
        />
      )}
    </div>
  );
};

export default EvidenceStorage;