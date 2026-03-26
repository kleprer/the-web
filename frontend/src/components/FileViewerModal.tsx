import React, { useState, useEffect } from 'react';
import { CloseOutlined, DownloadOutlined, FileImageOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';
import { AppFile } from '../types/index';
import { apiService } from '../services/api';

interface FileViewerModalProps {
  file: AppFile;
  onClose: () => void;
  onDownload: () => void;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ file, onClose, onDownload }) => {
  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Скачиваем файл как Blob
        const blob = await apiService.downloadFile(file.id);
        const url = URL.createObjectURL(blob);
        setFileBlobUrl(url);
      } catch (err) {
        console.error('Ошибка загрузки файла:', err);
        setError('Не удалось загрузить файл');
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    // Очистка URL при размонтировании
    return () => {
      if (fileBlobUrl) {
        URL.revokeObjectURL(fileBlobUrl);
      }
    };
  }, [file.id]);

  const getFileIcon = () => {
    if (file.file_type === 'image') {
      return <FileImageOutlined className="text-4xl text-blue-500" />;
    }
    if (file.mime_type === 'application/pdf') {
      return <FilePdfOutlined className="text-4xl text-red-500" />;
    }
    return <FileTextOutlined className="text-4xl text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTrustLevelLabel = (level: string | null | undefined) => {
    switch (level) {
      case 'high': return 'Высокий';
      case 'low': return 'Низкий';
      default: return 'Средний';
    }
  };

  const getTrustLevelColor = (level: string | null | undefined) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Загрузка файла...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-red-500 text-center">
            <p className="text-lg mb-2">{error}</p>
            <button
              onClick={onDownload}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Скачать файл
            </button>
          </div>
        </div>
      );
    }

    // Просмотр изображений
    if (file.file_type === 'image' && fileBlobUrl) {
      return (
        <div className="flex items-center justify-center min-h-96 bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={fileBlobUrl}
            alt={file.title || file.filename}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    }

    // Просмотр PDF
    if (file.mime_type === 'application/pdf' && fileBlobUrl) {
      return (
        <div className="h-[70vh]">
          <iframe
            src={`${fileBlobUrl}#toolbar=0`}
            className="w-full h-full rounded-lg"
            title={file.title || file.filename}
          />
        </div>
      );
    }

    // Для остальных типов показываем информацию и предлагаем скачать
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {getFileIcon()}
        <p className="mt-4 text-gray-600 text-center">
          Предварительный просмотр недоступен для файлов этого типа
        </p>
        <button
          onClick={onDownload}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <DownloadOutlined />
          Скачать файл
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              {file.title || file.filename}
            </h2>
            <div className="flex gap-3 mt-1 text-sm text-gray-500">
              <span>{formatFileSize(file.file_size)}</span>
              <span>•</span>
              <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
              {file.trust_level && (
                <>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getTrustLevelColor(file.trust_level)}`}>
                    Доверие: {getTrustLevelLabel(file.trust_level)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Скачать"
            >
              <DownloadOutlined className="text-xl" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <CloseOutlined className="text-xl" />
            </button>
          </div>
        </div>

        {file.description && (
          <div className="px-4 py-2 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">{file.description}</p>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;