from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import models
from schemas import note

router = APIRouter(prefix="/notes", tags=["notes"])

@router.post("/{investigation_id}/notes")
def create_note(
    investigation_id: int,
    note: note.NoteCreate,
    db: Session = Depends(get_db)
):
    # Verify investigation exists
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    db_note = models.Note(
        investigation_id=investigation_id,
        title=note.title,
        content=note.content,
        tags=note.tags or [],
        created_at=datetime.now()
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.get("/{investigation_id}/notes")
def get_investigation_notes(investigation_id: int, db: Session = Depends(get_db)):
    notes = db.query(models.Note).filter(
        models.Note.investigation_id == investigation_id
    ).order_by(models.Note.created_at.desc()).all()
    
    return notes

@router.put("/notes/{note_id}")
def update_note(note_id: int, note: note.NoteUpdate, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # update fields
    if note.title:
        db_note.title = note.title
    if note.content:
        db_note.content = note.content
    if note.tags:
        db_note.tags = note.tags
    
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(db_note)
    db.commit()
    
    return {"message": "Note deleted successfully"}