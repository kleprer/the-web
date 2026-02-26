from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import models
from schemas.board import BoardStateUpdate
from dependencies.auth import get_current_user

router = APIRouter(prefix="/board", tags=["board"])

@router.put("/{investigation_id}/state")
def save_board_state(
    investigation_id: int,
    board_data: BoardStateUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Сохранить состояние доски"""
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    investigation.board_data = board_data.board_data
    investigation.updated_at = datetime.now()
    db.commit()
    
    return {"message": "Board state saved successfully"}

@router.get("/{investigation_id}/state")
def get_board_state(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить состояние доски"""
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id,
        models.Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    return {
        "board_data": investigation.board_data or {
            "cards": [],
            "texts": [],
            "images": [],
            "connections": []
        }
    }