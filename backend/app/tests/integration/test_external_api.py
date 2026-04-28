import pytest
from unittest.mock import AsyncMock, patch

class TestExternalAPI:
    """Тесты интеграции с внешним API"""
    
    @pytest.mark.asyncio
    async def test_get_news_success(self, client, mock_news_api):
        """Тест успешного получения новостей"""
        response = client.get("/external/news?query=journalism")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "articles" in data
        assert "success" in data
    
    @pytest.mark.asyncio
    async def test_get_news_without_api_key(self, client, monkeypatch):
        """Тест получения новостей без API ключа"""
        monkeypatch.setenv("NEWS_API_KEY", "")
        
        import importlib
        import api.external
        importlib.reload(api.external)
        
        response = client.get("/external/news?query=test")
        
        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
    
    @pytest.mark.asyncio
    async def test_news_caching(self, client, mock_news_api):
        """Тест кэширования новостей"""
        response1 = client.get("/external/news?query=test")
        response2 = client.get("/external/news?query=test")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
    
    @pytest.mark.asyncio
    async def test_news_health_check(self, client):
        """Тест проверки здоровья внешнего API"""
        response = client.get("/external/news/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
    
    @pytest.mark.asyncio
    async def test_news_timeout_handling(self, client, monkeypatch):
        """Тест обработки таймаута внешнего API"""
        async def mock_timeout(*args, **kwargs):
            raise TimeoutError("Timeout")
        
        monkeypatch.setattr("api.external.httpx.AsyncClient.get", mock_timeout)
        
        response = client.get("/external/news?query=test")
        
        assert response.status_code == 200
        data = response.json()
        assert "articles" in data