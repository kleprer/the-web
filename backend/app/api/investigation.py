from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import models
from schemas import investigation

router = APIRouter(prefix="/investigations", tags=["investigations"])

@router.post("/")
def create_investigation(investigation: investigation.InvestigationCreate, db: Session = Depends(get_db)):
    db_investigation = models.Investigation(
        title=investigation.title,
        description=investigation.description,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        user_id=investigation.user_id
    )
    
    db.add(db_investigation)
    db.commit()
    db.refresh(db_investigation)
    
    return db_investigation

@router.get("/")
def list_investigations(user_id: int, db: Session = Depends(get_db)):
    investigations = db.query(models.Investigation).filter(
        models.Investigation.user_id == user_id,
        models.Investigation.is_archived == False
    ).all()
    return investigations

@router.get("/{investigation_id}")
def get_investigation(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    return investigation

@router.put("/{investigation_id}")
def update_investigation(investigation_id: int, investigation: investigation.InvestigationUpdate, db: Session = Depends(get_db)):
    db_investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not db_investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # update fields
    if investigation.title:
        db_investigation.title = investigation.title
    if investigation.description:
        db_investigation.description = investigation.description
    
    db_investigation.updated_at = datetime.now()
    db.commit()
    db.refresh(db_investigation)
    
    return db_investigation
