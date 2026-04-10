from fastapi import APIRouter
from typing import Optional
import httpx
import asyncio
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/external", tags=["external api"])

# конфигурация newsapi (можно без ключа, будет возвращать заглушку)
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

# кэш для результатов
_news_cache = {}
_cache_ttl = timedelta(minutes=10)


@router.get("/news")
async def get_news_for_investigation(
    query: Optional[str] = "журналистика"
):
    """
    получение новостей по теме из внешнего api
    """
    
    # если нет api ключа - возвращаем заглушку (graceful degradation)
    if not NEWS_API_KEY:
        return {
            "success": False,
            "error": "новостной api не настроен (требуется ключ newsapi.org)",
            "articles": [],
            "source": "demo mode"
        }
    
    # проверяем кэш
    cache_key = f"news_{query}"
    if cache_key in _news_cache:
        cached_time, cached_data = _news_cache[cache_key]
        if datetime.now() - cached_time < _cache_ttl:
            cached_data["cached"] = True
            return cached_data
    
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "language": "ru",
            "pageSize": 5,
            "apiKey": NEWS_API_KEY
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                articles = []
                for article in data.get("articles", []):
                    articles.append({
                        "title": article.get("title", "без названия"),
                        "description": article.get("description", ""),
                        "url": article.get("url", ""),
                        "source_name": article.get("source", {}).get("name", "неизвестный источник"),
                        "published_at": article.get("publishedAt", datetime.now().isoformat()),
                        "image_url": article.get("urlToImage", ""),
                        "author": article.get("author", ""),
                        "content_preview": (article.get("content", "") or "")[:200]
                    })
                
                result = {
                    "success": True,
                    "query": query,
                    "articles": articles,
                    "source": "newsapi.org"
                }
                
                # сохраняем в кэш
                _news_cache[cache_key] = (datetime.now(), result)
                return result
            else:
                return {
                    "success": False,
                    "error": f"api вернул ошибку: {response.status_code}",
                    "articles": []
                }
                
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "таймаут подключения к новостному api",
            "articles": []
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"ошибка: {str(e)}",
            "articles": []
        }


@router.get("/news/health")
async def external_api_health():
    """проверка доступности внешнего api"""
    if not NEWS_API_KEY:
        return {"status": "not_configured", "message": "api ключ не задан"}
    return {"status": "ok", "message": "api настроен"}