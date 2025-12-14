from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import models
from schemas import investigation
from dependencies.auth import get_current_user

router = APIRouter(prefix="/investigations", tags=["investigations"])

@router.post("/", response_model=investigation.InvestigationResponse)
def create_investigation(
    investigation_data: investigation.InvestigationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    initial_board_data = {
        "cards": [],
        "texts": [],
        "images": [],
        "connections": []
    }
    
    db_investigation = models.Investigation(
        title=investigation_data.title,
        description=investigation_data.description,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        user_id=current_user.id,
        board_data=initial_board_data
    )
    
    db.add(db_investigation)
    db.commit()
    db.refresh(db_investigation)
    
    return db_investigation

@router.get("/", response_model=list[investigation.InvestigationResponse])
def list_investigations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investigations = db.query(models.Investigation).filter(
        models.Investigation.user_id == current_user.id,
        models.Investigation.is_archived == False
    ).all()
    return investigations

@router.get("/{investigation_id}", response_model=investigation.InvestigationResponse)
def get_investigation(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    return investigation

@router.put("/{investigation_id}", response_model=investigation.InvestigationResponse)
def update_investigation(
    investigation_id: int,
    investigation_data: investigation.InvestigationUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not db_investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation_data.title:
        db_investigation.title = investigation_data.title
    if investigation_data.description:
        db_investigation.description = investigation_data.description
    
    db_investigation.updated_at = datetime.now()
    db.commit()
    db.refresh(db_investigation)
    
    return db_investigation

@router.delete("/{investigation_id}")
def delete_investigation(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    db.delete(investigation)
    db.commit()
    
    return {"message": "Investigation deleted successfully"}

@router.post("/{investigation_id}/archive")
def archive_investigation(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    investigation.is_archived = True
    db.commit()
    
    return {"message": "Investigation archived successfully"}

@router.post("/{investigation_id}/restore")
def restore_investigation(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    investigation.is_archived = False
    db.commit()
    
    return {"message": "Investigation restored successfully"}