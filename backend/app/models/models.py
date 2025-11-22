# backend/models/models.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

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