# seo.py - эндпоинты для SEO (sitemap, robots.txt)
from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse, JSONResponse
from utils.seo import generate_sitemap, generate_robots_txt, generate_article_json_ld, generate_webpage_json_ld
from datetime import datetime

router = APIRouter(tags=["seo"])

# список всех маршрутов для sitemap
PUBLIC_ROUTES = [
    "/",
    "/auth",
    "/boards",
    "/docs",
    "/health"
]

# служебные маршруты, которые нужно исключить из индексации
DISALLOW_ROUTES = [
    "/admin/",
    "/api/",
    "/openapi.json",
    "/redoc",
    "/docs"
]

@router.get("/sitemap.xml", response_class=PlainTextResponse)
async def get_sitemap():
    """
    генерирует sitemap.xml для поисковых систем
    """
    sitemap_content = generate_sitemap(PUBLIC_ROUTES)
    return Response(content=sitemap_content, media_type="application/xml")

@router.get("/robots.txt", response_class=PlainTextResponse)
async def get_robots_txt():
    """
    генерирует robots.txt с правилами обхода
    """
    robots_content = generate_robots_txt(PUBLIC_ROUTES, DISALLOW_ROUTES)
    return Response(content=robots_content, media_type="text/plain")

@router.get("/seo/json-ld/article")
async def get_article_json_ld(
    title: str,
    description: str,
    url: str
):
    """
    возвращает JSON-LD разметку для статьи
    """
    json_ld = generate_article_json_ld(
        title=title,
        description=description,
        url=url,
        date_published=datetime.now().isoformat()
    )
    return JSONResponse(content=json_ld)

@router.get("/seo/json-ld/webpage")
async def get_webpage_json_ld(
    name: str,
    description: str,
    url: str
):
    """
    возвращает JSON-LD разметку для веб-страницы
    """
    json_ld = generate_webpage_json_ld(
        name=name,
        description=description,
        url=url
    )
    return JSONResponse(content=json_ld)