from pydantic import BaseModel
from typing import Optional, List

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str