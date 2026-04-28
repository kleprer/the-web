import pytest
from datetime import datetime
from models import models

class TestUserModel:
    """Модульные тесты модели пользователя"""
    
    def test_create_user(self, db_session):
        """Тест создания пользователя"""
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash=models.User.get_password_hash("password123"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.is_active is True
        assert "user" in user.roles
    
    def test_password_verification(self, db_session):
        """Тест верификации пароля"""
        user = models.User(
            username="testuser2",
            email="test2@example.com",
            password_hash=models.User.get_password_hash("mypassword"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.verify_password("mypassword") is True
        assert user.verify_password("wrongpassword") is False
    
    def test_sha256_hashing(self):
        """Тест SHA256 хеширования"""
        password = "testpassword123"
        hash1 = models.User.get_sha256_hash(password)
        hash2 = models.User.get_sha256_hash(password)
        
        assert hash1 == hash2
        assert len(hash1) == 64
    
    def test_role_permissions_admin(self, db_session):
        """Тест прав администратора"""
        admin = models.User(
            username="admin",
            email="admin@test.com",
            password_hash=models.User.get_password_hash("adminpass"),
            created_at=datetime.now(),
            is_active=True,
            roles=["admin"]
        )
        db_session.add(admin)
        db_session.commit()
        
        assert admin.has_permission("any_permission") is True
        assert admin.has_any_role(["admin"]) is True
        assert admin.is_admin() is True
    
    def test_role_permissions_manager(self, db_session):
        """Тест прав менеджера"""
        manager = models.User(
            username="manager",
            email="manager@test.com",
            password_hash=models.User.get_password_hash("managerpass"),
            created_at=datetime.now(),
            is_active=True,
            roles=["manager"]
        )
        db_session.add(manager)
        db_session.commit()
        
        assert manager.has_permission("manage:users") is True
        assert manager.has_permission("create:investigation") is True
        assert manager.is_manager() is True
        assert manager.is_admin() is False
    
    def test_role_permissions_user(self, db_session):
        """Тест прав обычного пользователя"""
        user = models.User(
            username="regularuser",
            email="user@test.com",
            password_hash=models.User.get_password_hash("userpass"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.has_permission("create:investigation") is True
        assert user.has_permission("read:own_investigation") is True
        assert user.has_permission("manage:users") is False
        assert user.is_manager() is False
        assert user.is_admin() is False
    
    def test_has_any_role(self, db_session):
        """Тест проверки наличия любой роли"""
        user = models.User(
            username="roleuser",
            email="role@test.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user", "manager"]
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.has_any_role(["user"]) is True
        assert user.has_any_role(["manager"]) is True
        assert user.has_any_role(["admin"]) is False
        assert user.has_any_role(["user", "admin"]) is True
    
    def test_has_all_roles(self, db_session):
        """Тест проверки наличия всех ролей"""
        user = models.User(
            username="multirole",
            email="multi@test.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user", "manager"]
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.has_all_roles(["user"]) is True
        assert user.has_all_roles(["user", "manager"]) is True
        assert user.has_all_roles(["user", "admin"]) is False