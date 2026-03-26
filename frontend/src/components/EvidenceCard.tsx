import React from 'react';
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
  const getFileIcon = (fileType: string, mimeType: string): React.ReactElement => {
    if (fileType === 'image') return <PictureOutlined className="text-3xl" />;
    if (fileType === 'video') return <VideoCameraOutlined className="text-3xl" />;
    if (fileType === 'audio') return <CustomerServiceOutlined className="text-3xl" />;
    if (mimeType === 'application/pdf') return <FileTextOutlined className="text-3xl text-red-500" />;
    return <FileTextOutlined className="text-3xl" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onView}
      >
        <div className="flex flex-col items-center text-center">
          <div className="text-gray-600 mb-3">
            {getFileIcon(file.file_type, file.mime_type)}
          </div>
          
          <h3 className="font-medium text-gray-800 text-sm mb-1 truncate w-full">
            {file.title || file.filename}
          </h3>
          
          <p className="text-xs text-gray-500 mb-2">
            {formatFileSize(file.file_size)}
          </p>
          
          {/* Уровень доверия */}
          <div className={`mb-2 px-2 py-1 rounded-full text-xs font-medium ${getTrustLevelStyle(file.trust_level)}`}>
            {getTrustLevelLabel(file.trust_level)}
          </div>
          
          {file.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {file.description}
            </p>
          )}

          <div className="text-xs text-gray-400">
            {new Date(file.uploaded_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 flex divide-x divide-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="flex-1 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <EyeOutlined />
          <span>Просмотр</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="flex-1 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <DownloadOutlined />
          <span>Скачать</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex-1 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <DeleteOutlined />
          <span>Удалить</span>
        </button>
      </div>
    </div>
  );
};

export default EvidenceCard;