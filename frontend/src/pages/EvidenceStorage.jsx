// frontend/src/pages/EvidenceStorage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExportOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import EvidenceCard from '../components/EvidenceCard';
import ExportForm from '../components/ExportForm';
import Navbar from '../components/Navbar';
import { apiService } from '../services/api';
import { useAuth } from '../App';

const EvidenceStorage = () => {
  const { boardId } = useParams();
  const { user } = useAuth();
  const [investigation, setInvestigation] = useState(null);
  const [files, setFiles] = useState([]);
  const [showExportForm, setShowExportForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (boardId) {
      loadInvestigationData();
      loadFiles();
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

  const loadFiles = async () => {
    try {
      const filesData = await apiService.getFiles(boardId);
      setFiles(filesData);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        try {
          await apiService.uploadFile(boardId, file, {
            title: file.name,
            description: 'Добавлен через хранилище доказательств',
            tags: ['evidence']
          });
        } catch (error) {
          console.error('Ошибка загрузки файла:', error);
        }
      }
      
      // Перезагружаем файлы после загрузки
      loadFiles();
    };
    input.click();
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await apiService.deleteFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
    }
  };

  const handleCreateFolder = () => {
    // Для папок можно создать отдельную таблицу в БД или использовать теги
    console.log('Создание папки - функционал можно расширить');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#D6D6D6]">
        <Navbar currentBoardName={investigation?.title} />
        <div className="pt-16 flex items-center justify-center">
          <div className="text-gray-800">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D6D6D6]">
      <Navbar currentBoardName={investigation?.title} />

      <div className="flex-1 pt-16">
        <div className="p-6 border-b border-gray-400 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            Хранилище доказательств - {investigation?.title}
          </h1>
          
          <div className="flex gap-3">
            <button
              onClick={handleCreateFolder}
              className="flex items-center gap-2 bg-[#151516] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FolderAddOutlined />
              <span>Создать папку</span>
            </button>
            <button
              onClick={handleAddFile}
              className="flex items-center gap-2 bg-[#151516] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FileAddOutlined />
              <span>Добавить файл</span>
            </button>
            <button
              onClick={() => setShowExportForm(true)}
              className="flex items-center gap-2 bg-[#151516] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ExportOutlined />
              <span>Экспортировать в PDF</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-auto">
          {files.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              <p className="text-lg mb-4">Нет загруженных файлов</p>
              <p className="text-sm">Добавьте файлы для начала работы с доказательствами</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {files.map(file => (
                <EvidenceCard
                  key={file.id}
                  file={file}
                  onDelete={() => handleDeleteFile(file.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showExportForm && (
        <ExportForm
          files={files}
          investigation={investigation}
          onClose={() => setShowExportForm(false)}
          onExport={(selectedFiles) => {
            console.log('Экспорт файлов:', selectedFiles);
            setShowExportForm(false);
          }}
        />
      )}
    </div>
  );
};

export default EvidenceStorage;