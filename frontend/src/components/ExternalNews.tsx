import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source_name: string;
  published_at: string;
  image_url: string;
  author: string;
  content_preview: string;
}

interface ExternalNewsProps {
  investigationTitle?: string;
  customQuery?: string;
}

/**
 * компонент для отображения внешних новостей по теме расследования
 * с состояниями загрузки, ошибки и пустого результата
 * интеграция стороннего api (newsapi.org)
 */
const ExternalNews: React.FC<ExternalNewsProps> = ({ investigationTitle, customQuery }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>(customQuery || investigationTitle || 'журналистика');

  const fetchNews = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getExternalNews(searchQuery);
      
      if (response.success) {
        setArticles(response.articles || []);
      } else {
        // graceful degradation - показываем сообщение, но не ломаем интерфейс
        setError(response.error || 'не удалось загрузить новости');
        setArticles([]);
      }
    } catch (err) {
      console.error('ошибка загрузки внешних новостей:', err);
      setError('сервис новостей временно недоступен');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchQuery = customQuery || investigationTitle || 'журналистика';
    setQuery(searchQuery);
    fetchNews(searchQuery);
  }, [investigationTitle, customQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(query);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return 'дата неизвестна';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-lg">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-gray-300">
          📰 связанные новости
        </h3>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="поиск..."
            className="px-2 py-1 border border-gray-600 bg-gray-800 text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? '...' : 'найти'}
          </button>
        </form>
      </div>
      
      {/* состояние загрузки */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 mt-1 text-xs">загрузка...</p>
        </div>
      )}
      
      {/* состояние ошибки (graceful degradation) */}
      {!loading && error && (
        <div className="text-center py-3 bg-yellow-900/30 rounded-lg">
          <p className="text-yellow-600 text-xs">{error}</p>
          <p className="text-gray-500 text-xs mt-1">
            работа продолжается в обычном режиме
          </p>
        </div>
      )}
      
      {/* пустой результат */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-xs">новостей не найдено</p>
        </div>
      )}
      
      {/* список новостей */}
      {!loading && !error && articles.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {articles.map((article, idx) => (
            <div key={idx} className="border-b border-gray-700 pb-2 last:border-0">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block hover:bg-gray-800 p-2 rounded transition-colors"
              >
                <div className="flex gap-2">
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-200 text-xs line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                      {article.description || article.content_preview}
                    </p>
                    <div className="flex gap-2 mt-1 text-xs text-gray-500">
                      <span>{article.source_name}</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-right text-xs text-gray-600 mt-2">
        newsapi.org
      </div>
    </div>
  );
};

export default ExternalNews;