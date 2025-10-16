from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TimelineEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime

class TimelineEventCreate(TimelineEventBase):
    pass

class TimelineEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None

class TimelineEventResponse(TimelineEventBase):
    id: int
    investigation_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True