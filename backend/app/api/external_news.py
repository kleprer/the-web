# external_news.py - эндпоинты для работы с внешним новостным API
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from services.news_api import news_api_service
from dependencies.auth import get_current_user_optional
from models import models

router = APIRouter(prefix="/external/news", tags=["external_api"])

class NewsArticle(BaseModel):
    id: str
    title: str
    description: str
    url: str
    image_url: Optional[str] = None
    published_at: str
    source_name: str
    author: Optional[str] = None

class NewsResponse(BaseModel):
    articles: List[NewsArticle]
    total_results: int
    page: int
    page_size: int
    error: Optional[str] = None
    message: Optional[str] = None

@router.get("/search", response_model=NewsResponse)
async def search_news(
    keyword: str = Query(..., min_length=2, max_length=100, description="ключевое слово для поиска новостей"),
    page: int = Query(1, ge=1, le=10, description="номер страницы"),
    page_size: int = Query(10, ge=1, le=20, description="количество новостей на странице"),
    sort_by: str = Query("relevancy", regex="^(relevancy|publishedAt)$", description="сортировка"),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    поиск новостей по ключевому слову с использованием NewsAPI
    (требуется авторизация, но работает и без нее)
    """
    result = await news_api_service.get_news_by_keyword(
        keyword=keyword,
        page=page,
        page_size=page_size,
        sort_by=sort_by
    )
    
    # graceful degradation - если API недоступен, возвращаем пустой результат с сообщением
    if result.get("error"):
        return NewsResponse(
            articles=[],
            total_results=0,
            page=page,
            page_size=page_size,
            error=result.get("error"),
            message=result.get("message", "Новости временно недоступны. Попробуйте позже.")
        )
    
    return NewsResponse(
        articles=result.get("articles", []),
        total_results=result.get("total_results", 0),
        page=page,
        page_size=page_size,
        error=None,
        message=None
    )

@router.get("/top-headlines", response_model=NewsResponse)
async def get_top_headlines(
    category: str = Query("general", regex="^(business|entertainment|general|health|science|sports|technology)$"),
    country: str = Query("ru", regex="^(ru|us|gb|de|fr)$"),
    page_size: int = Query(10, ge=1, le=20),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    получает главные новости по категории
    """
    result = await news_api_service.get_top_headlines(
        category=category,
        country=country,
        page_size=page_size
    )
    
    if result.get("error"):
        return NewsResponse(
            articles=[],
            total_results=0,
            page=1,
            page_size=page_size,
            error=result.get("error"),
            message="Новости временно недоступны. Попробуйте позже."
        )
    
    return NewsResponse(
        articles=result.get("articles", []),
        total_results=result.get("total_results", 0),
        page=1,
        page_size=page_size,
        error=None,
        message=None
    )

@router.get("/health")
async def check_news_api_health():
    """
    проверяет доступность стороннего API
    """
    if not news_api_service.is_configured():
        return {
            "status": "not_configured",
            "message": "NewsAPI не настроен. Добавьте NEWS_API_KEY в .env файл"
        }
    
    # быстрая проверка - пытаемся получить 1 новость
    result = await news_api_service.get_top_headlines(page_size=1)
    
    if result.get("error"):
        return {
            "status": "unavailable",
            "error": result.get("error"),
            "message": "Сторонний API недоступен"
        }
    
    return {
        "status": "available",
        "message": "NewsAPI работает корректно"
    }