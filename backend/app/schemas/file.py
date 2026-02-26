from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FileBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []

class FileCreate(FileBase):
    pass

class FileUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class FileResponse(FileBase):
    id: int
    investigation_id: int
    filename: str
    file_type: str
    mime_type: str
    file_size: int
    uploaded_at: datetime
    uploaded_by: Optional[int] = None
    
    class Config:
        from_attributes = True