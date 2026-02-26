from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import models
from utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    print(f"🔐 Token endpoint login: {form_data.username}")
    
    # Ищем пользователя
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # Проверяем пароль
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создаем токен
    access_token = create_access_token(data={"sub": user.username})
    
    print(f"✅ Токен создан для {user.username}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }