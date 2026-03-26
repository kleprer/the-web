import secrets
from typing import Optional
from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class S3Config:
    # MinIO настройки (локальное хранилище)
    ENDPOINT = os.getenv("S3_ENDPOINT", "localhost:9000")
    ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
    SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
    BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "journalist-assistant")
    USE_SSL = os.getenv("S3_USE_SSL", "false").lower() == "true"
    REGION = os.getenv("S3_REGION", "us-east-1")
    
    @staticmethod
    def is_configured():
        """Проверяет, настроено ли S3"""
        return bool(S3Config.ACCESS_KEY and S3Config.SECRET_KEY)

class DatabaseConfig:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./journal.db")
    
class Settings(BaseSettings):
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    class Config:
        env_file = ".env"

settings = Settings()