from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean, Table
from database import Base
import hashlib
from datetime import datetime

# Таблица для связи многие-ко-многим между пользователями и ролями
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('role_id', Integer, ForeignKey('roles.id'))
)

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # admin, manager, user
    description = Column(String, nullable=True)
    permissions = Column(JSON, default=list)  # Список разрешений: ["create:investigation", "delete:any_file", ...]
    created_at = Column(DateTime, default=datetime.now)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=True)  # Старая колонка
    password_hash = Column(String, nullable=True)  # SHA256 хеш
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=True)
    
    # Связь с ролями
    roles = Column(JSON, default=["user"])  # Упрощенный подход - массив строк с ролями
    
    def verify_password(self, password: str):
        # Проверяем password_hash (SHA256)
        if self.password_hash:
            return self.get_sha256_hash(password) == self.password_hash
        
        # Проверяем старый password (plain text)
        elif self.password:
            return self.password == password
        
        return False
    
    @staticmethod
    def get_sha256_hash(password: str):
        """SHA256 хеширование"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def get_password_hash(password: str):
        """Публичный метод для хеширования"""
        return User.get_sha256_hash(password)
    
    def has_permission(self, permission: str) -> bool:
        """Проверка, есть ли у пользователя конкретное разрешение"""
        # Админ имеет все права
        if "admin" in self.roles:
            return True
        
        # Определяем базовые права для каждой роли
        role_permissions = {
            "admin": ["*"],  # все права
            "manager": [
                "create:investigation", "read:any_investigation", "update:any_investigation",
                "create:timeline", "update:timeline", "delete:own_timeline",
                "upload:file", "download:file", "delete:own_file",
                "manage:users"  # менеджеры могут управлять обычными пользователями
            ],
            "user": [
                "create:investigation", "read:own_investigation", "update:own_investigation",
                "create:timeline", "update:own_timeline", "delete:own_timeline",
                "upload:file", "download:own_file", "delete:own_file"
            ]
        }
        
        # Проверяем по всем ролям пользователя
        for role in self.roles:
            if role in role_permissions:
                if "*" in role_permissions[role] or permission in role_permissions[role]:
                    return True
        
        return False
    
    def has_any_role(self, roles: list) -> bool:
        """Проверка, есть ли у пользователя хотя бы одна из указанных ролей"""
        return any(role in self.roles for role in roles)
    
    def has_all_roles(self, roles: list) -> bool:
        """Проверка, есть ли у пользователя все указанные роли"""
        return all(role in self.roles for role in roles)
    
    def is_admin(self) -> bool:
        """Проверка, является ли пользователь администратором"""
        return "admin" in self.roles
    
    def is_manager(self) -> bool:
        """Проверка, является ли пользователь менеджером"""
        return "manager" in self.roles or self.is_admin()

class Investigation(Base):
    __tablename__ = "investigations"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_archived = Column(Boolean, default=False)
    board_data = Column(JSON, nullable=True)  # { cards: [], texts: [], images: [], connections: [] }

# Добавьте поле trust_level в модель File
class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), index=True)
    
    # file info
    filename = Column(String)
    file_path = Column(String)
    file_type = Column(String)  # 'document', 'image', 'video', 'audio'
    mime_type = Column(String)  # 'application/pdf', 'image/jpeg', etc.
    file_size = Column(Integer)
    uploaded_at = Column(DateTime)
    
    # metadata
    title = Column(String)
    description = Column(Text)
    tags = Column(JSON)
    trust_level = Column(String, default="unknown")  # 'high', 'unknown', 'low'
    
    # ownership
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), index=True)
    title = Column(String)
    description = Column(Text)
    event_date = Column(DateTime)
    created_at = Column(DateTime)
    attached_files = Column(JSON)  # IDs прикрепленных файлов

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), index=True)
    title = Column(String)
    content = Column(Text)
    created_at = Column(DateTime)
    tags = Column(JSON)