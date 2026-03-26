import React, { useState } from 'react';
import { CloseOutlined, UploadOutlined, LoadingOutlined, FileOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import { AppFile } from '../types/index';

interface UploadFileModalProps {
  investigationId: number;
  onClose: () => void;
  onSuccess: (file: AppFile) => void;
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ investigationId, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [trustLevel, setTrustLevel] = useState<'high' | 'unknown' | 'low'>('unknown');
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка размера файла (макс 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('Размер файла не должен превышать 100MB');
        return;
      }
      
      // Проверка типа файла
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'video/mp4', 'audio/mpeg'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        setError('Неподдерживаемый тип файла. Разрешены: изображения, PDF, DOC, TXT, MP4, MP3');
        return;
      }
      
      setSelectedFile(file);
      setTitle(file.name);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Выберите файл для загрузки');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedFile = await apiService.uploadFile(investigationId, selectedFile, {
        title: title || selectedFile.name,
        description: description,
        tags: ['evidence'],
        trust_level: trustLevel
      });
      
      onSuccess(uploadedFile);
    } catch (err: any) {
      console.error('Ошибка загрузки:', err);
      setError(err.message || 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Добавление файла</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <CloseOutlined />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Выбор файла */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Файл *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
              <div className="space-y-1 text-center">
                <UploadOutlined className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Выберите файл</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSelect} />
                  </label>
                  <p className="pl-1">или перетащите сюда</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, JPG, PNG, MP4, MP3 до 100MB
                </p>
              </div>
            </div>
            {selectedFile && (
              <div className="mt-2 p-2 bg-gray-50 rounded flex items-center gap-2">
                <FileOutlined className="text-gray-500" />
                <span className="text-sm text-gray-600 truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </div>

          {/* Название файла */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название файла"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание файла (необязательно)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Уровень доверия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень доверия источнику
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTrustLevel('high')}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                  trustLevel === 'high'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="font-medium">Высокий</div>
                <div className="text-xs">Проверенный источник</div>
              </button>
              <button
                type="button"
                onClick={() => setTrustLevel('unknown')}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                  trustLevel === 'unknown'
                    ? 'bg-gray-100 border-gray-500 text-gray-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Средний</div>
                <div className="text-xs">Требует проверки</div>
              </button>
              <button
                type="button"
                onClick={() => setTrustLevel('low')}
                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                  trustLevel === 'low'
                    ? 'bg-red-100 border-red-500 text-red-700'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="font-medium">Низкий</div>
                <div className="text-xs">Ненадежный источник</div>
              </button>
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={uploading}
          >
            Отмена
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <LoadingOutlined className="animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <UploadOutlined />
                Загрузить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadFileModal;