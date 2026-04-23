// frontend/src/components/EvidenceCard.tsx
import React, { useState } from 'react';
import { 
  FileTextOutlined, 
  PictureOutlined, 
  VideoCameraOutlined, 
  CustomerServiceOutlined, 
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { AppFile } from '../types/index';

interface EvidenceCardProps {
  file: AppFile;
  onDelete: () => void;
  onView: () => void;
  onDownload: () => void;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ file, onDelete, onView, onDownload }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const getFileIcon = (fileType: string, mimeType: string): React.ReactElement => {
    if (fileType === 'image') return <PictureOutlined className="text-3xl" data-testid="image-icon" />;
    if (fileType === 'video') return <VideoCameraOutlined className="text-3xl" data-testid="video-icon" />;
    if (fileType === 'audio') return <CustomerServiceOutlined className="text-3xl" data-testid="audio-icon" />;
    if (mimeType === 'application/pdf') return <FileTextOutlined className="text-3xl text-red-500" data-testid="pdf-icon" />;
    return <FileTextOutlined className="text-3xl" data-testid="document-icon" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    // Убираем .0 для целых чисел
    return (Number.isInteger(size) ? Math.round(size) : size) + ' ' + sizes[i];
  };

  const getTrustLevelStyle = (level: string | null | undefined) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTrustLevelLabel = (level: string | null | undefined) => {
    switch (level) {
      case 'high': return 'Высокий';
      case 'low': return 'Низкий';
      default: return 'Средний';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getThumbnailUrl = (): string | null => {
    if (file.file_type === 'image') {
      return `http://localhost:8000/files/download/${file.id}`;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();
  const isImage = file.file_type === 'image';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      onDelete();
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView();
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload();
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden" data-testid="evidence-card">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleViewClick}
      >
        <div className="flex flex-col items-center text-center">
          {isImage && thumbnailUrl ? (
            <div className="w-full h-28 mb-3 overflow-hidden rounded-lg bg-gray-100">
              {!imageLoaded && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse text-gray-400 text-xs">загрузка...</div>
                </div>
              )}
              <img
                src={thumbnailUrl}
                alt={file.title || file.filename}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  console.error('ошибка загрузки миниатюры');
                  (e.target as HTMLImageElement).style.display = 'none';
                  setImageLoaded(true);
                }}
              />
            </div>
          ) : (
            <div className="text-gray-600 mb-3" data-testid="file-icon">
              {getFileIcon(file.file_type, file.mime_type)}
            </div>
          )}
          
          <h3 className="font-medium text-gray-800 text-sm mb-1 truncate w-full" data-testid="file-title">
            {file.title || file.filename}
          </h3>
          
          <p className="text-xs text-gray-500 mb-2" data-testid="file-size">
            {formatFileSize(file.file_size)}
          </p>
          
          <div className={`mb-2 px-2 py-1 rounded-full text-xs font-medium ${getTrustLevelStyle(file.trust_level)}`} data-testid="trust-level">
            {getTrustLevelLabel(file.trust_level)}
          </div>
          
          {file.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2" data-testid="file-description">
              {file.description}
            </p>
          )}

          <div className="text-xs text-gray-400" data-testid="file-date">
            {formatDate(file.uploaded_at)}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 flex divide-x divide-gray-100">
        <button
          onClick={handleViewClick}
          className="flex-1 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 text-sm"
          data-testid="view-button"
        >
          <EyeOutlined />
          <span>Просмотр</span>
        </button>
        <button
          onClick={handleDownloadClick}
          className="flex-1 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-1 text-sm"
          data-testid="download-button"
        >
          <DownloadOutlined />
          <span>Скачать</span>
        </button>
        <button
          onClick={handleDeleteClick}
          className="flex-1 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1 text-sm"
          data-testid="delete-button"
        >
          <DeleteOutlined />
          <span>Удалить</span>
        </button>
      </div>
    </div>
  );
};

export default EvidenceCard;