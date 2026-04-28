import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from utils.jwt import create_access_token, create_refresh_token, verify_token
from config import settings

class TestJWT:
    
    def test_create_access_token(self):
        data = {"sub": "testuser"}
        token = create_access_token(data)
        assert token is not None
        assert isinstance(token, str)
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == "testuser"
    
    def test_create_access_token_with_expiry(self):
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=5)
        token = create_access_token(data, expires_delta)
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert "exp" in payload
        
        exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        time_diff = (exp_time - now).total_seconds()
        assert 290 < time_diff < 310
    
    def test_create_refresh_token(self):
        data = {"sub": "testuser"}
        token = create_refresh_token(data)
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == "testuser"
        assert payload["type"] == "refresh"
    
    def test_verify_valid_token(self):
        data = {"sub": "testuser"}
        token = create_access_token(data)
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "testuser"
    
    def test_verify_invalid_token(self):
        invalid_token = "invalid.token.here"
        payload = verify_token(invalid_token)
        assert payload is None
    
    def test_verify_expired_token(self):
        expired_time = datetime.now(timezone.utc) - timedelta(seconds=1)
        expired_data = {"sub": "testuser", "exp": expired_time.timestamp()}
        expired_token = jwt.encode(expired_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        payload = verify_token(expired_token)
        assert payload is None
    
    def test_token_without_sub(self):
        data = {"user_id": 123}
        token = create_access_token(data)
        payload = verify_token(token)
        assert payload is not None