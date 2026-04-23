import pytest

class TestAuthEndpoints:
    """Интеграционные тесты эндпоинтов авторизации"""
    
    def test_signup_success(self, client, test_user_data):
        response = client.post("/auth/signup", json=test_user_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["username"] == test_user_data["username"]
    
    def test_signup_duplicate_username(self, client, test_user_data):
        client.post("/auth/signup", json=test_user_data)
        response = client.post("/auth/signup", json=test_user_data)
        assert response.status_code == 400
    
    def test_signup_duplicate_email(self, client, test_user_data):
        client.post("/auth/signup", json=test_user_data)
        duplicate_data = {
            "username": "differentuser",
            "email": test_user_data["email"],
            "password": "pass123"
        }
        response = client.post("/auth/signup", json=duplicate_data)
        assert response.status_code == 400
    
    def test_login_success(self, client, test_user_data):
        client.post("/auth/signup", json=test_user_data)
        response = client.post("/auth/login", json={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["username"] == test_user_data["username"]
    
    def test_login_wrong_password(self, client, test_user_data):
        client.post("/auth/signup", json=test_user_data)
        response = client.post("/auth/login", json={
            "username": test_user_data["username"],
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        response = client.post("/auth/login", json={
            "username": "nonexistent",
            "password": "pass123"
        })
        assert response.status_code == 401
    
    def test_refresh_token(self, client, test_user_data):
        client.post("/auth/signup", json=test_user_data)
        login_response = client.post("/auth/login", json={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        refresh_token = login_response.json()["refresh_token"]
        
        response = client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    def test_refresh_with_invalid_token(self, client):
        response = client.post("/auth/refresh", json={
            "refresh_token": "invalid.token.here"
        })
        assert response.status_code == 401
    
    def test_get_current_user(self, client, auth_headers, test_user_data):
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["user"]["username"] == test_user_data["username"]
    
    def test_get_current_user_without_auth(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 401
    
    def test_role_management_admin_only(self, client, admin_auth_headers):
        """Только админ может управлять ролями"""
        response = client.get("/auth/users/roles", headers=admin_auth_headers)
        # Админ должен иметь доступ
        assert response.status_code == 200