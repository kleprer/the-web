from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
import models

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/global")
def global_search(query: str, user_id: int, db: Session = Depends(get_db)):
    """Search across all user's investigations"""
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    search_term = f"%{query}%"
    
    # search investigations
    investigations = db.query(models.Investigation).filter(
        models.Investigation.user_id == user_id,
        models.Investigation.is_archived == False,
        or_(
            models.Investigation.title.ilike(search_term),
            models.Investigation.description.ilike(search_term)
        )
    ).all()
    
    # search files
    files = db.query(models.File).filter(
        models.File.investigation_id.in_([inv.id for inv in investigations]),
        or_(
            models.File.title.ilike(search_term),
            models.File.description.ilike(search_term),
            models.File.filename.ilike(search_term)
        )
    ).all()
    
    # search notes
    notes = db.query(models.Note).filter(
        models.Note.investigation_id.in_([inv.id for inv in investigations]),
        or_(
            models.Note.title.ilike(search_term),
            models.Note.content.ilike(search_term)
        )
    ).all()
    
    # search timeline events
    events = db.query(models.TimelineEvent).filter(
        models.TimelineEvent.investigation_id.in_([inv.id for inv in investigations]),
        or_(
            models.TimelineEvent.title.ilike(search_term),
            models.TimelineEvent.description.ilike(search_term)
        )
    ).all()
    
    return {
        "investigations": investigations,
        "files": files,
        "notes": notes,
        "timeline_events": events
    }

@router.get("/investigation/{investigation_id}")
def search_in_investigation(investigation_id: int, query: str, db: Session = Depends(get_db)):
    """Search within specific investigation"""
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    search_term = f"%{query}%"
    
    # Verify investigation exists
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # Search files
    files = db.query(models.File).filter(
        models.File.investigation_id == investigation_id,
        or_(
            models.File.title.ilike(search_term),
            models.File.description.ilike(search_term),
            models.File.filename.ilike(search_term)
        )
    ).all()
    
    # search notes
    notes = db.query(models.Note).filter(
        models.Note.investigation_id == investigation_id,
        or_(
            models.Note.title.ilike(search_term),
            models.Note.content.ilike(search_term)
        )
    ).all()
    
    # search timeline events
    events = db.query(models.TimelineEvent).filter(
        models.TimelineEvent.investigation_id == investigation_id,
        or_(
            models.TimelineEvent.title.ilike(search_term),
            models.TimelineEvent.description.ilike(search_term)
        )
    ).all()
    
    return {
        "files": files,
        "notes": notes,
        "timeline_events": events
    }