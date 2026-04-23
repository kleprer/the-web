from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any

class InvestigationBase(BaseModel):
    title: str
    description: Optional[str] = None

class InvestigationCreate(InvestigationBase):
    """Схема для создания расследования - user_id берется из токена"""
    pass

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class InvestigationResponse(InvestigationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_archived: bool = False
    board_data: Optional[Any] = None
    
    model_config = ConfigDict(from_attributes=True)