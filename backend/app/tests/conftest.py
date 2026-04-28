import sys
import os
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
import asyncio

from database import Base, get_db
from main import app
from models import models

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_engine():
    """Создание тестовой БД - новая для каждого теста"""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(test_engine):
    """Фикстура для сессии БД"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def client(db_session):
    """Тестовый клиент FastAPI"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def test_user_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    }

@pytest.fixture
def test_admin_data():
    return {
        "username": "testadmin",
        "email": "admin@test.com",
        "password": "adminpass123"
    }

@pytest.fixture
def test_investigation_data():
    return {
        "title": "Test Investigation",
        "description": "This is a test investigation"
    }

@pytest.fixture
def auth_headers(client, test_user_data):
    """Заголовки авторизации для обычного пользователя"""
    signup_response = client.post("/auth/signup", json=test_user_data)
    if signup_response.status_code != 200:
        pass
    
    response = client.post("/auth/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    
    assert response.status_code == 200, f"Login failed: {response.text}"
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}

@pytest.fixture
def admin_auth_headers(client, db_session):
    """Заголовки авторизации для админа"""
    admin = models.User(
        username="testadmin",
        email="admin@test.com",
        password_hash=models.User.get_password_hash("adminpass123"),
        created_at=datetime.now(),
        is_active=True,
        roles=["admin"]
    )
    db_session.add(admin)
    db_session.commit()
    
    response = client.post("/auth/login", json={
        "username": "testadmin",
        "password": "adminpass123"
    })
    
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}

@pytest.fixture
def mock_news_api(monkeypatch):
    """Мок для News API"""
    class MockNewsAPI:
        async def get_news_by_keyword(self, keyword, page=1, page_size=10, sort_by="relevancy"):
            return {
                "articles": [
                    {
                        "id": f"news_1",
                        "title": f"Test news about {keyword}",
                        "description": "Test description",
                        "url": "http://test.com/news",
                        "image_url": "http://test.com/image.jpg",
                        "published_at": datetime.now().isoformat(),
                        "source_name": "Test Source",
                        "author": "Test Author",
                        "content_preview": "Preview content"
                    }
                ],
                "total_results": 1,
                "page": page,
                "page_size": page_size,
                "error": None
            }
        
        def is_configured(self):
            return True
    
    async def mock_get_news(*args, **kwargs):
        return await MockNewsAPI().get_news_by_keyword(kwargs.get('query', 'test'))
    
    from api import external
    monkeypatch.setattr(external, "get_news_for_investigation", mock_get_news)
    
    return MockNewsAPI()

@pytest.fixture
def mock_s3_service(monkeypatch):
    """Мок для S3 сервиса"""
    class MockS3Service:
        def __init__(self):
            self.files = {}
        
        def upload_file(self, file_data, filename, content_type):
            import uuid
            file_key = f"mock_key_{uuid.uuid4()}"
            self.files[file_key] = file_data
            return {'file_key': file_key, 'file_path': f"s3://mock/{file_key}"}
        
        def download_file(self, file_key):
            return self.files.get(file_key, b'mock_file_content')
        
        def delete_file(self, file_key):
            if file_key in self.files:
                del self.files[file_key]
            return True
    
    mock_service = MockS3Service()
    
    try:
        from api import files
        monkeypatch.setattr(files, "s3_service", mock_service)
    except ImportError:
        pass
    
    return mock_service