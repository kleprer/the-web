from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from schemas.token import RefreshTokenRequest
from database import get_db
from models import models
from utils.jwt import create_access_token, create_refresh_token
from typing import List, Optional

router = APIRouter(prefix="/auth", tags=["authentication"])

class UserSignup(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: str
    roles: List[str] = ["user"]  # Добавляем роли в ответ


@router.post("/signup", response_model=TokenResponse)
def signup(user: UserSignup, db: Session = Depends(get_db)):
    # Проверяем, существует ли пользователь
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем или email уже существует"
        )
    
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=models.User.get_password_hash(user.password),
        created_at=datetime.now(),
        is_active=True,
        roles=["user"]  # По умолчанию обычный пользователь
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Создаем токены
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        roles=new_user.roles
    )

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Вход пользователя с отладкой"""
    print(f"🔐 Попытка входа: username={user.username}")
    
    # Ищем пользователя
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    
    if not db_user:
        print(f"❌ Пользователь {user.username} не найден")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильное имя пользователя или пароль"
        )
    
    print(f"✅ Пользователь найден: id={db_user.id}")
    print(f"   Роли: {db_user.roles}")
    
    # Проверяем пароль через метод verify_password
    password_correct = False
    
    try:
        password_correct = db_user.verify_password(user.password)
        print(f"🔍 Результат verify_password: {password_correct}")
    except Exception as e:
        print(f"⚠️ Ошибка в verify_password: {e}")
    
    # Если не сработало, пробуем прямое сравнение
    if not password_correct and db_user.password_hash:
        from models.models import User
        input_hash = User.get_sha256_hash(user.password)
        print(f"🔍 Сравнение хешей:")
        print(f"   Введенный пароль хеш: {input_hash}")
        print(f"   Хеш в базе: {db_user.password_hash}")
        print(f"   Совпадают: {input_hash == db_user.password_hash}")
        
        if input_hash == db_user.password_hash:
            password_correct = True
            print(f"✅ Пароль совпадает по хешу!")
    
    # Если все еще не сработало, проверяем старый пароль
    if not password_correct and db_user.password:
        print(f"🔍 Проверка старого пароля: {user.password} == {db_user.password}")
        if db_user.password == user.password:
            password_correct = True
            print(f"✅ Пароль совпадает (старый формат)!")
            # Обновляем на хешированный
            try:
                from models.models import User
                db_user.password_hash = User.get_sha256_hash(user.password)
                db_user.password = None
                db.commit()
                print(f"🔄 Пароль обновлен на хешированный")
            except:
                pass
    
    if not password_correct:
        print(f"❌ Неправильный пароль для пользователя {user.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильное имя пользователя или пароль"
        )
    
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь неактивен"
        )
    
    print(f"✅ Успешный вход для {user.username}")
    
    # Создаем токены
    access_token = create_access_token(data={"sub": db_user.username})
    refresh_token = create_refresh_token(data={"sub": db_user.username})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        roles=db_user.roles  # Возвращаем роли
    )

@router.post("/simple-login")
def simple_login(user: UserLogin, db: Session = Depends(get_db)):
    """Старый endpoint для входа (для обратной совместимости)"""
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    
    if not db_user or not db_user.verify_password(user.password):
        raise HTTPException(status_code=401, detail="Wrong username or password")
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "roles": db_user.roles,
        "message": "Login successful"
    }

@router.get("/debug-user/{username}")
def debug_user(username: str, db: Session = Depends(get_db)):
    """Отладочный endpoint - посмотреть пользователя в базе"""
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        return {"error": "User not found"}
    
    # Проверяем разные способы хеширования
    from models.models import User
    
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "password": user.password,
            "password_hash": user.password_hash,
            "is_active": user.is_active,
            "created_at": str(user.created_at),
            "roles": user.roles
        },
        "hash_info": {
            "password_hash_length": len(user.password_hash) if user.password_hash else 0,
            "is_sha256_hash": user.password_hash and len(user.password_hash) == 64,
            "is_bcrypt_hash": user.password_hash and user.password_hash.startswith('$2b$'),
            "is_plain_text": user.password_hash and len(user.password_hash) < 64
        }
    }

@router.post("/test-login")
def test_login(username: str, password: str, db: Session = Depends(get_db)):
    """Тестовый вход с детальной отладкой"""
    print(f"🔐 Тестовый вход: username={username}, password={password}")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        print("❌ Пользователь не найден")
        return {"error": "User not found"}
    
    print(f"✅ Пользователь найден: id={user.id}")
    print(f"   password_hash: {user.password_hash}")
    print(f"   password: {user.password}")
    print(f"   roles: {user.roles}")
    
    # Пробуем проверить пароль
    from models.models import User
    
    # 1. Проверяем через метод verify_password
    verify_result = user.verify_password(password)
    print(f"🔍 Результат verify_password: {verify_result}")
    
    # 2. Проверяем напрямую
    if user.password_hash:
        sha256_hash = User.get_sha256_hash(password)
        print(f"🔍 SHA256 хеш введенного пароля: {sha256_hash}")
        print(f"🔍 SHA256 хеш в базе: {user.password_hash}")
        direct_match = sha256_hash == user.password_hash
        print(f"🔍 Прямое сравнение хешей: {direct_match}")
    else:
        direct_match = False
    
    # 3. Проверяем старый пароль
    old_password_match = user.password == password if user.password else False
    
    return {
        "user_exists": True,
        "user_id": user.id,
        "username": user.username,
        "roles": user.roles,
        "verify_password_result": verify_result,
        "direct_hash_match": direct_match,
        "old_password_match": old_password_match,
        "stored_hash": user.password_hash,
        "stored_password": user.password
    }

from dependencies.auth import get_current_user

@router.get("/me")
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    if not current_user:
        return {"authenticated": False}
    
    return {
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "roles": current_user.roles
        }
    }

@router.get("/me-simple")
def get_current_user_simple(current_user: models.User = Depends(get_current_user)):
    """Простая версия для фронтенда"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "roles": current_user.roles
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Обновить access токен с помощью refresh токена"""
    from utils.jwt import verify_token
    
    payload = verify_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидный refresh token"
        )
    
    username = payload.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Создаем новые токены
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        username=user.username,
        email=user.email,
        roles=user.roles
    )

@router.get("/public/me")
def get_public_user_info(token: str = None, db: Session = Depends(get_db)):
    """Публичный endpoint для проверки токена (без требований авторизации)"""
    from utils.jwt import verify_token
    
    if not token:
        return {"authenticated": False, "message": "No token provided"}
    
    payload = verify_token(token)
    if not payload:
        return {"authenticated": False, "message": "Invalid token"}
    
    username = payload.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        return {"authenticated": False, "message": "User not found"}
    
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": user.roles
        }
    }

# Эндпоинты для управления ролями (только для админов)
class RoleUpdate(BaseModel):
    user_id: int
    roles: List[str]

@router.get("/users/roles")
def get_all_users_with_roles(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить всех пользователей с их ролями (только для админов и менеджеров)"""
    # Проверяем права
    if not current_user.has_any_role(["admin", "manager"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    users = db.query(models.User).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": user.roles,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
        for user in users
    ]

@router.put("/users/roles")
def update_user_roles(
    role_update: RoleUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить роли пользователя (только для админов и менеджеров)"""
    # Проверяем права
    if not current_user.has_any_role(["admin", "manager"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    # Проверяем, что менеджер не пытается дать себе админские права
    if current_user.is_manager() and not current_user.is_admin():
        if "admin" in role_update.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Менеджеры не могут назначать роль администратора"
            )
    
    user = db.query(models.User).filter(models.User.id == role_update.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем роли
    user.roles = role_update.roles
    db.commit()
    
    return {
        "message": "Роли пользователя обновлены",
        "user_id": user.id,
        "username": user.username,
        "roles": user.roles
    }

@router.post("/users/{user_id}/make-admin")
def make_user_admin(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Сделать пользователя администратором (только для админов)"""
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут назначать других администраторов"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if "admin" not in user.roles:
        user.roles = user.roles + ["admin"]
        db.commit()
    
    return {
        "message": f"Пользователь {user.username} теперь администратор",
        "user_id": user.id,
        "roles": user.roles
    }