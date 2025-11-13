// components/Toolbar.jsx
import React from 'react';
import { 
  SelectOutlined, 
  ArrowsAltOutlined, 
  PlusOutlined, 
  FileTextOutlined, 
  LinkOutlined, 
  PictureOutlined 
} from '@ant-design/icons';

const Toolbar = ({ 
  onSelectArea, 
  onMoveCanvas, 
  onAddCard, 
  onAddText, 
  onConnect, 
  onAddPhoto,
  isMovingCanvas = false 
}) => {
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-4 z-50">
      <div className="bg-[#D6D6D6] rounded-t-2xl px-6 py-3 flex gap-6 items-center shadow-lg">
        
        {/* Select Area */}
        <button 
          onClick={onSelectArea}
          className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <SelectOutlined className="text-2xl text-gray-800" />
          <span className="text-xs text-gray-800">Select area</span>
        </button>

        {/* Move Canvas */}
        <button 
          onClick={onMoveCanvas}
          className={`flex flex-col items-center gap-1 transition-all ${
            isMovingCanvas ? 'text-blue-600' : 'hover:opacity-70'
          }`}
        >
          <ArrowsAltOutlined className="text-2xl text-gray-800" />
          <span className="text-xs text-gray-800">Переместиться</span>
        </button>

        {/* Add Card */}
        <button 
          onClick={onAddCard}
          className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <PlusOutlined className="text-2xl text-gray-800" />
          <span className="text-xs text-gray-800">Добавить карточку</span>
        </button>

        {/* Add Text */}
        <button 
          onClick={onAddText}
          className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <FileTextOutlined className="text-2xl text-gray-800" />
          <span className="text-xs text-gray-800">Добавить текст</span>
        </button>

        {/* Connect */}
        <button 
          onClick={onConnect}
          className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <LinkOutlined className="text-2xl text-gray-800" />
          <span className="text-xs text-gray-800">Соединить</span>
        </button>

        {/* Add Photo */}
        <button 
          onClick={onAddPhoto}
          className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <PictureOutlined className="text-2xl text-gray-800" />
          <span className="text-xs text-gray-800">Добавить фото</span>
        </button>

      </div>
    </div>
  );
};

export default Toolbar;