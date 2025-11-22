# backend/api/board.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import models
from schemas import board

router = APIRouter(prefix="/board", tags=["board"])

@router.put("/{investigation_id}/state")
def save_board_state(
    investigation_id: int, 
    board_data: board.BoardStateUpdate,
    db: Session = Depends(get_db)
):
    """Сохранить состояние доски (карточки, текст, изображения, соединения)"""
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    investigation.board_data = board_data.board_data
    db.commit()
    
    return {"message": "Board state saved successfully"}

@router.get("/{investigation_id}/state")
def get_board_state(investigation_id: int, db: Session = Depends(get_db)):
    """Получить состояние доски"""
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
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