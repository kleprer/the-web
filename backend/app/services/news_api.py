import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os
from functools import wraps

class NewsAPIService:
    """
    сервис для работы с NewsAPI.org (стороннее API)
    предоставляет новости по ключевым словам для журналистских расследований
    """
    
    def __init__(self):
        self.api_key = os.getenv("NEWS_API_KEY", "")
        self.base_url = "https://newsapi.org/v2"
        self.timeout = 10.0  # таймаут 10 секунд
        self.max_retries = 3
        self.retry_delay = 1.0  # секунды
        
    def is_configured(self) -> bool:
        """проверяет, настроен ли API ключ"""
        return bool(self.api_key) and self.api_key != ""
    
    async def _make_request(
        self, 
        endpoint: str, 
        params: Dict[str, Any],
        retry_count: int = 0
    ) -> Optional[Dict[str, Any]]:
        """
        выполняет запрос к API с обработкой ошибок и повторными попытками
        """
        if not self.is_configured():
            return None
        
        url = f"{self.base_url}{endpoint}"
        params["apiKey"] = self.api_key
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    # превышение лимита запросов
                    if retry_count < self.max_retries:
                        await asyncio.sleep(self.retry_delay * (retry_count + 1))
                        return await self._make_request(endpoint, params, retry_count + 1)
                    return {"error": "rate_limit_exceeded", "articles": []}
                elif response.status_code == 401:
                    return {"error": "invalid_api_key", "articles": []}
                else:
                    return {"error": f"http_{response.status_code}", "articles": []}
                    
        except httpx.TimeoutException:
            if retry_count < self.max_retries:
                await asyncio.sleep(self.retry_delay * (retry_count + 1))
                return await self._make_request(endpoint, params, retry_count + 1)
            return {"error": "timeout", "articles": []}
            
        except Exception as e:
            return {"error": str(e), "articles": []}
    
    async def get_news_by_keyword(
        self, 
        keyword: str, 
        page: int = 1, 
        page_size: int = 10,
        sort_by: str = "relevancy"
    ) -> Dict[str, Any]:
        """
        получает новости по ключевому слову
        нормализует ответ в формат приложения
        """
        if not self.is_configured():
            return {
                "articles": [],
                "total_results": 0,
                "error": "news_api_not_configured",
                "message": "API новостей не настроен. Добавьте NEWS_API_KEY в .env файл"
            }
        
        params = {
            "q": keyword,
            "pageSize": min(page_size, 100),
            "page": page,
            "sortBy": sort_by,
            "language": "ru",
            "apiKey": self.api_key
        }
        
        response = await self._make_request("/everything", params)
        
        if not response or "error" in response:
            return {
                "articles": [],
                "total_results": 0,
                "error": response.get("error", "unknown_error") if response else "no_response",
                "message": "Не удалось загрузить новости"
            }
        
        # нормализация ответа в формат приложения
        normalized_articles = []
        for article in response.get("articles", [])[:page_size]:
            normalized_articles.append({
                "id": f"news_{hash(article.get('url', ''))}",
                "title": article.get("title", "Без названия"),
                "description": article.get("description", ""),
                "content": article.get("content", ""),
                "url": article.get("url", ""),
                "image_url": article.get("urlToImage", ""),
                "published_at": article.get("publishedAt", datetime.now().isoformat()),
                "source_name": article.get("source", {}).get("name", "Неизвестный источник"),
                "author": article.get("author", "")
            })
        
        return {
            "articles": normalized_articles,
            "total_results": response.get("totalResults", 0),
            "page": page,
            "page_size": page_size,
            "error": None
        }
    
    async def get_top_headlines(
        self, 
        category: str = "general",
        country: str = "ru",
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        получает главные новости по категории
        """
        if not self.is_configured():
            return {
                "articles": [],
                "total_results": 0,
                "error": "news_api_not_configured"
            }
        
        params = {
            "country": country,
            "category": category,
            "pageSize": min(page_size, 100),
            "apiKey": self.api_key
        }
        
        response = await self._make_request("/top-headlines", params)
        
        if not response or "error" in response:
            return {
                "articles": [],
                "total_results": 0,
                "error": response.get("error", "unknown_error") if response else "no_response"
            }
        
        normalized_articles = []
        for article in response.get("articles", [])[:page_size]:
            normalized_articles.append({
                "id": f"headline_{hash(article.get('url', ''))}",
                "title": article.get("title", "Без названия"),
                "description": article.get("description", ""),
                "url": article.get("url", ""),
                "image_url": article.get("urlToImage", ""),
                "published_at": article.get("publishedAt", datetime.now().isoformat()),
                "source_name": article.get("source", {}).get("name", "Неизвестный источник")
            })
        
        return {
            "articles": normalized_articles,
            "total_results": response.get("totalResults", 0),
            "error": None
        }

# глобальный экземпляр сервиса
news_api_service = NewsAPIService()