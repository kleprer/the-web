from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from database import get_db
from models import models
from utils.jwt import verify_token
from schemas.token import TokenData
from typing import Optional, List

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    auto_error=False  # Разрешаем неавторизованные запросы для обратной совместимости
)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Невалидные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        # Для обратной совместимости - если нет токена, проверяем сессию или другие методы
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация"
        )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    token_data = TokenData(username=username)
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    
    if user is None:
        raise credentials_exception
    
    return user

# Для опциональной авторизации (если API может работать без авторизации)
async def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    if not token:
        return None
    
    try:
        payload = verify_token(token)
        if payload is None:
            return None
        
        username: str = payload.get("sub")
        if username is None:
            return None
        
        user = db.query(models.User).filter(models.User.username == username).first()
        return user
    except Exception:
        return None

def require_user_id(user_id: int, current_user: models.User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому ресурсу"
        )
    return user_id

# Декоратор для проверки разрешений
def require_permission(permission: str):
    def permission_dependency(current_user: models.User = Depends(get_current_user)):
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуется разрешение: {permission}"
            )
        return current_user
    return permission_dependency

# Проверка ролей
def require_any_role(roles: List[str]):
    def role_dependency(current_user: models.User = Depends(get_current_user)):
        if not current_user.has_any_role(roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуется одна из ролей: {', '.join(roles)}"
            )
        return current_user
    return role_dependency

def require_all_roles(roles: List[str]):
    def role_dependency(current_user: models.User = Depends(get_current_user)):
        if not current_user.has_all_roles(roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуются все роли: {', '.join(roles)}"
            )
        return current_user
    return role_dependency

# Проверка доступа к ресурсу (владелец или админ)
def require_resource_owner(resource_user_id: int):
    def owner_dependency(current_user: models.User = Depends(get_current_user)):
        if current_user.id != resource_user_id and not current_user.is_admin():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нет доступа к этому ресурсу"
            )
        return current_user
    return owner_dependency