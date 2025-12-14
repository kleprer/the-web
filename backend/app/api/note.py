from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import models
from schemas import note
from dependencies.auth import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])

@router.post("/{investigation_id}/notes")
def create_note(
    investigation_id: int,
    note_data: note.NoteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new note"""

    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    db_note = models.Note(
        investigation_id=investigation_id,
        title=note_data.title,
        content=note_data.content,
        tags=note_data.tags or [],
        created_at=datetime.now()
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.get("/{investigation_id}/notes")
def get_investigation_notes(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notes for investigation"""

    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    notes = db.query(models.Note).filter(
        models.Note.investigation_id == investigation_id
    ).order_by(models.Note.created_at.desc()).all()
    
    return notes

@router.put("/notes/{note_id}")
def update_note(
    note_id: int,
    note_data: note.NoteUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a note"""
    db_note = db.query(models.Note).join(
        models.Investigation,
        models.Investigation.id == models.Note.investigation_id
    ).filter(
        models.Note.id == note_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # update fields
    if note_data.title:
        db_note.title = note_data.title
    if note_data.content:
        db_note.content = note_data.content
    if note_data.tags:
        db_note.tags = note_data.tags
    
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note"""
    db_note = db.query(models.Note).join(
        models.Investigation,
        models.Investigation.id == models.Note.investigation_id
    ).filter(
        models.Note.id == note_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(db_note)
    db.commit()
    
    return {"message": "Note deleted successfully"}