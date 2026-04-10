from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from models import models
from database import engine, get_db
from api.auth import router as auth_router
from api.investigation import router as investigations_router
from api.files import router as files_router
from api.timeline import router as timelines_router
from api.note import router as notes_router
from api.search import router as search_router
from api.user import router as user_router
from api.board import router as board_router
from api.token import router as token_router 
from datetime import datetime 
from api.seo import router as seo_router
from api.external import router as external_router

# Создаем таблицы
models.Base.metadata.create_all(bind=engine)

# Функция для создания начальных данных
def init_db():
    db = next(get_db())
    
    # Проверяем, есть ли уже пользователи
    if db.query(models.User).count() == 0:
        # Создаем администратора
        admin = models.User(
            username="admin",
            email="admin@example.com",
            password_hash=models.User.get_password_hash("admin123"),
            is_active=True,
            created_at=datetime.now(),
            roles=["admin"]
        )
        db.add(admin)
        
        # Создаем менеджера
        manager = models.User(
            username="manager",
            email="manager@example.com",
            password_hash=models.User.get_password_hash("manager123"),
            is_active=True,
            created_at=datetime.now(),
            roles=["manager"]
        )
        db.add(manager)
        
        # Создаем обычного пользователя
        user = models.User(
            username="user",
            email="user@example.com",
            password_hash=models.User.get_password_hash("user123"),
            is_active=True,
            created_at=datetime.now(),
            roles=["user"]
        )
        db.add(user)
        
        db.commit()
        print("✅ Созданы начальные пользователи:")
        print("   admin/admin123 - Администратор")
        print("   manager/manager123 - Менеджер")
        print("   user/user123 - Обычный пользователь")

app = FastAPI(
    title="Journalist Assistant API",
    description="API для журналистских расследований с доской для визуализации связей",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Инициализация базы данных
init_db()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Подключаем все роутеры
app.include_router(auth_router)
app.include_router(token_router)
app.include_router(investigations_router)
app.include_router(timelines_router)
app.include_router(files_router)
app.include_router(search_router)
app.include_router(notes_router)
app.include_router(user_router)
app.include_router(board_router)
app.include_router(seo_router)
app.include_router(external_router)

@app.get("/sitemap.xml", response_class=Response)
async def sitemap_xml():
    """
    sitemap.xml - карта сайта для поисковых систем
    """
    base_url = "http://localhost:3000"
    current_date = datetime.now().date().isoformat()
    
    # правильный xml
    sitemap_xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{base_url}/</loc>
    <lastmod>{current_date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>{base_url}/auth</loc>
    <lastmod>{current_date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>{base_url}/boards</loc>
    <lastmod>{current_date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>"""
    
    return Response(content=sitemap_xml_content, media_type="application/xml")

@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    return """User-agent: *
Allow: /$
Allow: /auth
Allow: /boards
Allow: /board/
Allow: /timeline/
Allow: /evidence/

Disallow: /admin/
Disallow: /api/
Disallow: /docs
Disallow: /redoc
Disallow: /openapi.json
Disallow: /health

Sitemap: http://localhost:8000/sitemap.xml
"""

@app.get("/")
def read_root():
    return {
        "message": "Journalist Assistant API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}