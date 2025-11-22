# backend/main.py
from fastapi import FastAPI, Depends
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

# 🔥 ПЕРЕСОЗДАЕМ ВСЕ ТАБЛИЦЫ С НОВЫМИ ПОЛЯМИ
models.Base.metadata.drop_all(bind=engine)  # Удаляем старые таблицы
models.Base.metadata.create_all(bind=engine)  # Создаем новые

app = FastAPI(title="Journalist Assistant API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключите все роутеры
app.include_router(auth_router)
app.include_router(investigations_router)
app.include_router(timelines_router)
app.include_router(files_router)
app.include_router(search_router)
app.include_router(notes_router)
app.include_router(user_router)
app.include_router(board_router)

@app.get("/")
def read_root():
    return {"message": "Journalist Assistant API is running"}