from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FileBase(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = []

class FileCreate(FileBase):
    pass

class FileResponse(FileBase):
    id: int
    investigation_id: int
    filename: str
    file_type: str
    mime_type: str
    file_size: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True