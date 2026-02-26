from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class InvestigationBase(BaseModel):
    title: str
    description: Optional[str] = None

class InvestigationCreate(InvestigationBase):
    user_id: int

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class InvestigationResponse(InvestigationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_archived: bool = False
    board_data: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True