# backend/tests/e2e/test_api_flows.py - полностью исправленный файл

import pytest
from datetime import datetime

class TestAPIE2EFlows:
    """Сквозные тесты API"""
    
    def test_complete_user_journey(self, client):
        """Полный путь пользователя"""
        # 1. Регистрация
        user_data = {
            "username": f"e2e_user_{datetime.now().timestamp()}",
            "email": f"e2e_{datetime.now().timestamp()}@test.com",
            "password": "testpass123"
        }
        signup_response = client.post("/auth/signup", json=user_data)
        assert signup_response.status_code == 200
        access_token = signup_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # 2. Создание расследования
        investigation_data = {
            "title": "E2E Test Investigation",
            "description": "Testing full flow"
        }
        inv_response = client.post("/investigations/", json=investigation_data, headers=headers)
        assert inv_response.status_code == 200
        investigation_id = inv_response.json()["id"]
        
        # 3. Сохранение состояния доски
        board_state = {
            "board_data": {
                "cards": [{"id": "card-1", "title": "E2E Card", "position": {"x": 100, "y": 100}}],
                "texts": [],
                "images": [],
                "connections": []
            }
        }
        board_response = client.put(f"/board/{investigation_id}/state", json=board_state, headers=headers)
        assert board_response.status_code == 200
        
        # 4. Получение состояния доски
        get_board_response = client.get(f"/board/{investigation_id}/state", headers=headers)
        assert get_board_response.status_code == 200
        
        # 5. Удаление расследования
        delete_response = client.delete(f"/investigations/{investigation_id}", headers=headers)
        assert delete_response.status_code == 200
    
    def test_crud_investigation_flow(self, client, auth_headers):
        """Тест CRUD операций с расследованием"""
        # CREATE
        create_data = {
            "title": "CRUD Test Investigation",
            "description": "Testing CRUD operations"
        }
        create_response = client.post("/investigations/", json=create_data, headers=auth_headers)
        assert create_response.status_code == 200
        inv_id = create_response.json()["id"]
        
        # READ
        read_response = client.get(f"/investigations/{inv_id}", headers=auth_headers)
        assert read_response.status_code == 200
        assert read_response.json()["title"] == create_data["title"]
        
        # UPDATE
        update_data = {"title": "Updated CRUD Title"}
        update_response = client.put(f"/investigations/{inv_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        assert update_response.json()["title"] == "Updated CRUD Title"
        
        # DELETE
        delete_response = client.delete(f"/investigations/{inv_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify DELETE
        verify_response = client.get(f"/investigations/{inv_id}", headers=auth_headers)
        assert verify_response.status_code == 404