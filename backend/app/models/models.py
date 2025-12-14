# backend/models/models.py - ФИНАЛЬНЫЙ РАБОЧИЙ ВАРИАНТ
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from database import Base
import hashlib

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=True)  # Старая колонка
    password_hash = Column(String, nullable=True)  # SHA256 хеш
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=True)
    
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