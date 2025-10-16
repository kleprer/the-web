from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import models
from schemas import timeline

router = APIRouter(prefix="/timelines", tags=["timelines"])

@router.post("/{investigation_id}/events")
def create_timeline_event(
    investigation_id: int, 
    event: timeline.TimelineEventCreate,
    db: Session = Depends(get_db)
):
    # Verify investigation exists
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
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
def get_timeline_events(investigation_id: int, db: Session = Depends(get_db)):
    events = db.query(models.TimelineEvent).filter(
        models.TimelineEvent.investigation_id == investigation_id
    ).order_by(models.TimelineEvent.event_date).all()
    
    return events

@router.put("/events/{event_id}")
def update_timeline_event(
    event_id: int, 
    event: timeline.TimelineEventUpdate,
    db: Session = Depends(get_db)
):
    db_event = db.query(models.TimelineEvent).filter(
        models.TimelineEvent.id == event_id
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
def delete_timeline_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.TimelineEvent).filter(
        models.TimelineEvent.id == event_id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    db.delete(db_event)
    db.commit()
    
    return {"message": "Timeline event deleted successfully"}