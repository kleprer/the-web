from fastapi import HTTPException, status
from models import models

def require_permission(current_user: models.User, permission: str):
    """
    Проверяет, есть ли у пользователя необходимое разрешение.
    Выбрасывает 403 если разрешения нет.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if not current_user.has_permission(permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied. Required: {permission}"
        )
    
    return True

def require_any_role(current_user: models.User, roles: list):
    """
    Проверяет, есть ли у пользователя хотя бы одна из указанных ролей.
    Выбрасывает 403 если нет.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if not current_user.has_any_role(roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Required roles: {roles}"
        )
    
    return True