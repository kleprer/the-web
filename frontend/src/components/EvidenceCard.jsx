// frontend/src/components/EvidenceCard.jsx
import React from 'react';
import { 
  FileTextOutlined, 
  PictureOutlined, 
  VideoCameraOutlined, 
  CustomerServiceOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';

const EvidenceCard = ({ file, onDelete }) => {
  const getFileIcon = (fileType, mimeType) => {
    if (fileType === 'image') return <PictureOutlined className="text-2xl" />;
    if (fileType === 'video') return <VideoCameraOutlined className="text-2xl" />;
    if (fileType === 'audio') return <CustomerServiceOutlined className="text-2xl" />;
    if (mimeType === 'application/pdf') return <FileTextOutlined className="text-2xl text-red-500" />;
    return <FileTextOutlined className="text-2xl" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`http://localhost:8000/files/download/${file.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Ошибка скачивания:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center text-center">
        <div className="text-gray-600 mb-2">
          {getFileIcon(file.file_type, file.mime_type)}
        </div>
        
        <h3 className="font-medium text-gray-800 text-sm mb-1 truncate w-full">
          {file.title || file.filename}
        </h3>
        
        <p className="text-xs text-gray-500 mb-2">
          {formatFileSize(file.file_size)}
        </p>
        
        {file.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {file.description}
          </p>
        )}

        <div className="flex gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600 transition-colors"
          >
            Скачать
          </button>
          
          <button
            onClick={onDelete}
            className="bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 transition-colors"
          >
            <DeleteOutlined />
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-400">
          {new Date(file.uploaded_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default EvidenceCard;