from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from api.token import router as token_router  # Импортируем новый роутер
from datetime import datetime 

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
app.include_router(token_router)  # Важно: этот роутер должен быть перед остальными
app.include_router(investigations_router)
app.include_router(timelines_router)
app.include_router(files_router)
app.include_router(search_router)
app.include_router(notes_router)
app.include_router(user_router)
app.include_router(board_router)

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