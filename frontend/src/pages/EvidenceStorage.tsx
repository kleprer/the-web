import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FileAddOutlined, SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons';
import EvidenceCard from '../components/EvidenceCard';
import Navbar from '../components/Navbar';
import UploadFileModal from '../components/UploadFileModal';
import FileViewerModal from '../components/FileViewerModal';
import { apiService } from '../services/api';
import { Investigation, AppFile } from '../types/index';

interface FilterState {
  searchQuery: string;
  trustLevel: string | null;
  fileType: string | null;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' | 'trust_asc' | 'trust_desc' | 'size_asc' | 'size_desc';
  page: number;
  limit: number;
}

const ITEMS_PER_PAGE = 12;

const EvidenceStorage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [allFiles, setAllFiles] = useState<AppFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showViewerModal, setShowViewerModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<AppFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<number>(0);

  // Состояние фильтров из URL
  const [filters, setFilters] = useState<FilterState>(() => {
    const params = new URLSearchParams(location.search);
    return {
      searchQuery: params.get('search') || '',
      trustLevel: params.get('trust') || null,
      fileType: params.get('type') || null,
      dateFrom: params.get('dateFrom') || '',
      dateTo: params.get('dateTo') || '',
      sortBy: (params.get('sort') as FilterState['sortBy']) || 'date_desc',
      page: parseInt(params.get('page') || '1'),
      limit: ITEMS_PER_PAGE,
    };
  });

  const loadInvestigationData = useCallback(async (): Promise<void> => {
    if (!boardId) return;
    try {
      const data = await apiService.getInvestigation(parseInt(boardId));
      setInvestigation(data);
    } catch (error) {
      console.error('Ошибка загрузки расследования:', error);
      setError('Не удалось загрузить данные расследования');
    }
  }, [boardId]);

  const loadFiles = useCallback(async (): Promise<void> => {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);
      
      // Формируем параметры для серверной фильтрации
      const params: any = {
        investigation_id: parseInt(boardId),
        page: filters.page,
        limit: filters.limit,
      };
      
      if (filters.searchQuery && filters.searchQuery.trim()) {
        params.search = filters.searchQuery.trim();
      }
      if (filters.trustLevel) {
        params.trust_level = filters.trustLevel;
      }
      if (filters.fileType) {
        params.file_type = filters.fileType;
      }
      if (filters.dateFrom) {
        params.date_from = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.date_to = filters.dateTo;
      }
      if (filters.sortBy) {
        params.sort_by = filters.sortBy;
      }
      
      console.log('📤 Загрузка файлов с параметрами:', params);
      
      const response = await apiService.getFilesWithFilters(params);
      
      console.log('📥 Получено файлов:', response.items.length, 'Всего:', response.total);
      
      setAllFiles(response.items);
      setTotalFiles(response.total);
      
      // Если текущая страница больше общего количества страниц, переходим на последнюю
      if (response.pages > 0 && filters.page > response.pages) {
        setFilters(prev => ({ ...prev, page: response.pages }));
      }
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      setError('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  }, [boardId, filters.page, filters.limit, filters.searchQuery, filters.trustLevel, filters.fileType, filters.dateFrom, filters.dateTo, filters.sortBy]);

  useEffect(() => {
    if (boardId) {
      loadInvestigationData();
    }
  }, [boardId, loadInvestigationData]);

  useEffect(() => {
    if (boardId) {
      loadFiles();
    }
  }, [boardId, loadFiles]);

  // Обновление URL при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.set('search', filters.searchQuery);
    if (filters.trustLevel) params.set('trust', filters.trustLevel);
    if (filters.fileType) params.set('type', filters.fileType);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.sortBy !== 'date_desc') params.set('sort', filters.sortBy);
    if (filters.page > 1) params.set('page', filters.page.toString());
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [filters, navigate, location.pathname]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      trustLevel: null,
      fileType: null,
      dateFrom: '',
      dateTo: '',
      sortBy: 'date_desc',
      page: 1,
      limit: ITEMS_PER_PAGE,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadSuccess = (newFile: AppFile) => {
    loadFiles();
    setShowUploadModal(false);
  };

  const handleDeleteFile = async (fileId: number): Promise<void> => {
    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) return;
    
    try {
      await apiService.deleteFile(fileId);
      loadFiles();
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      setError('Не удалось удалить файл');
    }
  };

  // Прямое скачивание файла через window.open
  const handleDownloadFile = (file: AppFile) => {
    const downloadUrl = `http://localhost:8000/files/download/${file.id}`;
    console.log('📥 Скачивание файла:', downloadUrl);
    window.open(downloadUrl, '_blank');
  };

  // Просмотр файла
  const handleViewFile = (file: AppFile) => {
      // Для остальных показываем модальное окно
      setSelectedFile(file);
      setShowViewerModal(true);
    
  };

  const getTrustLevelLabel = (level: string | null | undefined) => {
    switch (level) {
      case 'high': return 'Высокий';
      case 'low': return 'Низкий';
      default: return 'Средний';
    }
  };

  const getFileTypeLabel = (type: string | null) => {
    switch (type) {
      case 'image': return 'Изображения';
      case 'document': return 'Документы';
      case 'media': return 'Медиа';
      case 'other': return 'Другое';
      default: return 'Все';
    }
  };

  const totalPages = Math.ceil(totalFiles / ITEMS_PER_PAGE);

  if (loading && allFiles.length === 0) {
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
        <div className="p-6 border-b border-gray-400 flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Хранилище доказательств - {investigation?.title}
          </h1>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <FilterOutlined />
              <span>Фильтры</span>
              {(filters.searchQuery || filters.trustLevel || filters.fileType || filters.dateFrom || filters.dateTo) && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-[#151516] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FileAddOutlined />
              <span>Добавить файл</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {showFilters && (
          <div className="p-6 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Фильтры и поиск</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <CloseOutlined />
                Сбросить все
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Поиск по названию
                </label>
                <div className="relative">
                  <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) => updateFilter('searchQuery', e.target.value)}
                    placeholder="Введите название файла..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип файла
                </label>
                <select
                  value={filters.fileType || ''}
                  onChange={(e) => updateFilter('fileType', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все</option>
                  <option value="image">Изображения</option>
                  <option value="document">Документы</option>
                  <option value="media">Видео/Аудио</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Уровень доверия
                </label>
                <select
                  value={filters.trustLevel || ''}
                  onChange={(e) => updateFilter('trustLevel', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все</option>
                  <option value="high">Высокий</option>
                  <option value="unknown">Средний</option>
                  <option value="low">Низкий</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата от
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата до
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сортировка
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as FilterState['sortBy'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date_desc">Сначала новые</option>
                  <option value="date_asc">Сначала старые</option>
                  <option value="name_asc">По названию (А-Я)</option>
                  <option value="name_desc">По названию (Я-А)</option>
                  <option value="trust_desc">По доверию (высокий → низкий)</option>
                  <option value="trust_asc">По доверию (низкий → высокий)</option>
                  <option value="size_desc">По размеру (большие → малые)</option>
                  <option value="size_asc">По размеру (малые → большие)</option>
                </select>
              </div>
            </div>
            
            {(filters.searchQuery || filters.trustLevel || filters.fileType || filters.dateFrom || filters.dateTo) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Активные фильтры:</span>
                  {filters.searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Поиск: {filters.searchQuery}
                      <button onClick={() => updateFilter('searchQuery', '')} className="hover:text-blue-600">×</button>
                    </span>
                  )}
                  {filters.fileType && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Тип: {getFileTypeLabel(filters.fileType)}
                      <button onClick={() => updateFilter('fileType', null)} className="hover:text-blue-600">×</button>
                    </span>
                  )}
                  {filters.trustLevel && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Доверие: {getTrustLevelLabel(filters.trustLevel)}
                      <button onClick={() => updateFilter('trustLevel', null)} className="hover:text-blue-600">×</button>
                    </span>
                  )}
                  {filters.dateFrom && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      От: {new Date(filters.dateFrom).toLocaleDateString()}
                      <button onClick={() => updateFilter('dateFrom', '')} className="hover:text-blue-600">×</button>
                    </span>
                  )}
                  {filters.dateTo && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      До: {new Date(filters.dateTo).toLocaleDateString()}
                      <button onClick={() => updateFilter('dateTo', '')} className="hover:text-blue-600">×</button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-gray-600">
              Найдено файлов: <span className="font-semibold">{totalFiles}</span>
            </div>
            {totalFiles > 0 && (
              <div className="text-gray-500 text-sm">
                Страница {filters.page} из {totalPages || 1}
              </div>
            )}
          </div>
          
          {totalFiles === 0 ? (
            <div className="text-center text-gray-600 py-12">
              <p className="text-lg mb-4">
                {filters.searchQuery || filters.trustLevel || filters.fileType || filters.dateFrom || filters.dateTo
                  ? 'Нет файлов, соответствующих фильтрам' 
                  : 'Нет загруженных файлов'}
              </p>
              <p className="text-sm">
                {filters.searchQuery || filters.trustLevel || filters.fileType || filters.dateFrom || filters.dateTo
                  ? 'Попробуйте изменить параметры фильтрации'
                  : 'Добавьте файлы для начала работы с доказательствами'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {allFiles.map(file => (
                  <EvidenceCard
                    key={file.id}
                    file={file}
                    onDelete={() => handleDeleteFile(file.id)}
                    onView={() => handleViewFile(file)}
                    onDownload={() => handleDownloadFile(file)}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className={`px-3 py-1 rounded-lg ${
                      filters.page === 1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    ←
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (filters.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-lg ${
                          filters.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className={`px-3 py-1 rounded-lg ${
                      filters.page === totalPages
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showUploadModal && (
        <UploadFileModal
          investigationId={parseInt(boardId!)}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {showViewerModal && selectedFile && (
        <FileViewerModal
          file={selectedFile}
          onClose={() => {
            setShowViewerModal(false);
            setSelectedFile(null);
          }}
          onDownload={() => handleDownloadFile(selectedFile)}
        />
      )}
    </div>
  );
};

export default EvidenceStorage;