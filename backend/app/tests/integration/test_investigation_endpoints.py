import pytest

class TestInvestigationEndpoints:
    
    def test_create_investigation(self, client, auth_headers, test_investigation_data):
        response = client.post("/investigations/", 
                               json=test_investigation_data,
                               headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == test_investigation_data["title"]
        assert "id" in data
    
    def test_list_investigations(self, client, auth_headers, test_investigation_data):
        # Создаем два расследования
        client.post("/investigations/", json=test_investigation_data, headers=auth_headers)
        client.post("/investigations/", 
                    json={**test_investigation_data, "title": "Second Investigation"},
                    headers=auth_headers)
        
        response = client.get("/investigations/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
    
    def test_get_investigation_by_id(self, client, auth_headers, test_investigation_data):
        create_response = client.post("/investigations/", 
                                      json=test_investigation_data,
                                      headers=auth_headers)
        investigation_id = create_response.json()["id"]
        
        response = client.get(f"/investigations/{investigation_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == investigation_id
    
    def test_get_investigation_not_found(self, client, auth_headers):
        response = client.get("/investigations/99999", headers=auth_headers)
        assert response.status_code == 404
    
    def test_update_investigation(self, client, auth_headers, test_investigation_data):
        create_response = client.post("/investigations/", 
                                      json=test_investigation_data,
                                      headers=auth_headers)
        investigation_id = create_response.json()["id"]
        
        update_data = {"title": "Updated Title"}
        response = client.put(f"/investigations/{investigation_id}",
                              json=update_data,
                              headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
    
    def test_delete_investigation(self, client, auth_headers, test_investigation_data):
        create_response = client.post("/investigations/", 
                                      json=test_investigation_data,
                                      headers=auth_headers)
        investigation_id = create_response.json()["id"]
        
        response = client.delete(f"/investigations/{investigation_id}", headers=auth_headers)
        assert response.status_code == 200
        
        get_response = client.get(f"/investigations/{investigation_id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_save_board_state(self, client, auth_headers, test_investigation_data):
        create_response = client.post("/investigations/", 
                                      json=test_investigation_data,
                                      headers=auth_headers)
        investigation_id = create_response.json()["id"]
        
        board_state = {
            "board_data": {
                "cards": [{"id": "card-1", "title": "Test Card", "position": {"x": 100, "y": 100}}],
                "texts": [],
                "images": [],
                "connections": []
            }
        }
        
        response = client.put(f"/board/{investigation_id}/state",
                              json=board_state,
                              headers=auth_headers)
        assert response.status_code == 200
    
    def test_get_board_state(self, client, auth_headers, test_investigation_data):
        create_response = client.post("/investigations/", 
                                      json=test_investigation_data,
                                      headers=auth_headers)
        investigation_id = create_response.json()["id"]
        
        board_state = {
            "board_data": {
                "cards": [{"id": "card-1", "title": "Test"}],
                "texts": [],
                "images": [],
                "connections": []
            }
        }
        client.put(f"/board/{investigation_id}/state",
                   json=board_state,
                   headers=auth_headers)
        
        response = client.get(f"/board/{investigation_id}/state", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "board_data" in data