# backend/api/timeline.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import models
from schemas import timeline
from dependencies.auth import get_current_user

router = APIRouter(prefix="/timelines", tags=["timelines"])

@router.post("/{investigation_id}/events")
def create_timeline_event(
    investigation_id: int,
    event: timeline.TimelineEventCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новое событие таймлайна"""
    # Verify investigation exists and belongs to user
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    db_event = models.TimelineEvent(
        investigation_id=investigation_id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        created_at=datetime.now()
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return db_event

@router.get("/{investigation_id}/events")
def get_timeline_events(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить все события таймлайна для расследования"""
    # Verify investigation exists and belongs to user
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    events = db.query(models.TimelineEvent).filter(
        models.TimelineEvent.investigation_id == investigation_id
    ).order_by(models.TimelineEvent.event_date).all()
    
    return events

@router.put("/events/{event_id}")
def update_timeline_event(
    event_id: int,
    event: timeline.TimelineEventUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить событие таймлайна"""
    db_event = db.query(models.TimelineEvent).join(
        models.Investigation,
        models.Investigation.id == models.TimelineEvent.investigation_id
    ).filter(
        models.TimelineEvent.id == event_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    # update fields
    if event.title:
        db_event.title = event.title
    if event.description:
        db_event.description = event.description
    if event.event_date:
        db_event.event_date = event.event_date
    
    db.commit()
    db.refresh(db_event)
    
    return db_event

@router.delete("/events/{event_id}")
def delete_timeline_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить событие таймлайна"""
    db_event = db.query(models.TimelineEvent).join(
        models.Investigation,
        models.Investigation.id == models.TimelineEvent.investigation_id
    ).filter(
        models.TimelineEvent.id == event_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    db.delete(db_event)
    db.commit()
    
    return {"message": "Timeline event deleted successfully"}