from database import SessionLocal
from models import models
from datetime import datetime
import hashlib

def create_admin_user():
    db = SessionLocal()
    
    # Проверяем, есть ли уже админ
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    
    if admin:
        print(f"✅ Пользователь admin уже существует с ролями: {admin.roles}")
        # Обновляем роли
        admin.roles = ["admin"]
        admin.password_hash = models.User.get_password_hash("admin123")
        db.commit()
        print("🔄 Роли обновлены на admin")
    else:
        # Создаем нового админа
        new_admin = models.User(
            username="admin",
            email="admin@example.com",
            password_hash=models.User.get_password_hash("admin123"),
            created_at=datetime.now(),
            is_active=True,
            roles=["admin"]
        )
        db.add(new_admin)
        db.commit()
        print("✅ Новый администратор создан!")
    
    # Проверяем других пользователей
    manager = db.query(models.User).filter(models.User.username == "manager").first()
    if not manager:
        manager = models.User(
            username="manager",
            email="manager@example.com",
            password_hash=models.User.get_password_hash("manager123"),
            created_at=datetime.now(),
            is_active=True,
            roles=["manager"]
        )
        db.add(manager)
        print("✅ Менеджер создан")
    
    user = db.query(models.User).filter(models.User.username == "user").first()
    if not user:
        user = models.User(
            username="user",
            email="user@example.com",
            password_hash=models.User.get_password_hash("user123"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user"]
        )
        db.add(user)
        print("✅ Обычный пользователь создан")
    
    db.commit()
    
    # Показываем всех пользователей
    print("\n📋 Все пользователи в базе:")
    all_users = db.query(models.User).all()
    for u in all_users:
        print(f"   ID: {u.id}, Username: {u.username}, Roles: {u.roles}")
    
    db.close()

if __name__ == "__main__":
    create_admin_user()