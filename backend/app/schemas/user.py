from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    roles: List[str] = ["user"]
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        # Добавляем кастомный json encoder для обработки JSON поля
        json_encoders = {
            # Если roles приходит как строка, преобразуем в список
            list: lambda v: v if isinstance(v, list) else [v] if v else ["user"]
        }