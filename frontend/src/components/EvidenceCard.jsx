// components/EvidenceCard.jsx
import React from 'react';
import { 
  FilePdfOutlined, 
  FileImageOutlined, 
  FileWordOutlined, 
  FileExcelOutlined, 
  PlayCircleOutlined, 
  CustomerServiceOutlined,
  FileOutlined,
  FolderOutlined
} from '@ant-design/icons';

const EvidenceCard = ({ name, type, size }) => {
  const getFileIcon = () => {
    switch (type) {
      case 'pdf':
        return <FilePdfOutlined className="text-red-500 text-2xl" />;
      case 'image':
        return <FileImageOutlined className="text-green-500 text-2xl" />;
      case 'word':
        return <FileWordOutlined className="text-blue-500 text-2xl" />;
      case 'excel':
        return <FileExcelOutlined className="text-green-600 text-2xl" />;
      case 'video':
        return <PlayCircleOutlined className="text-purple-500 text-2xl" />;
      case 'audio':
        return <CustomerServiceOutlined className="text-orange-500 text-2xl" />;
      case 'folder':
        return <FolderOutlined className="text-yellow-500 text-2xl" />;
      default:
        return <FileOutlined className="text-gray-500 text-2xl" />;
    }
  };

  const getFileExtension = (fileName) => {
    return fileName.split('.').pop().toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
      <div className="flex flex-col items-center text-center">
        {/* Иконка */}
        <div className="mb-3">
          {getFileIcon()}
        </div>
        
        {/* Название файла */}
        <div className="text-sm font-medium text-gray-800 mb-1 truncate w-full">
          {name}
        </div>
        
        {/* Расширение и размер */}
        <div className="text-xs text-gray-500">
          {type !== 'folder' && (
            <>
              {getFileExtension(name)} • {size}
            </>
          )}
          {type === 'folder' && (
            <>Папка</>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceCard;