from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import models
from schemas.user import UserResponse, UserUpdate
from dependencies.auth import get_current_user, require_permission
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    return current_user

@router.put("/me")
def update_my_profile(
    user_update: UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    if user_update.username:
        existing_user = db.query(models.User).filter(
            models.User.username == user_update.username,
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        current_user.username = user_update.username
    
    if user_update.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")
        
        current_user.email = user_update.email
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile updated successfully", "user": current_user}

@router.delete("/me")
def delete_my_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user account"""
    current_user.is_active = False
    db.commit()
    
    return {"message": "Account deactivated successfully"}

@router.get("/", response_model=List[UserResponse])
def get_all_users(
    current_user: models.User = Depends(require_permission("manage:users")),
    db: Session = Depends(get_db)
):
    """Get all users (admin and manager only)"""
    users = db.query(models.User).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: models.User = Depends(require_permission("manage:users")),
    db: Session = Depends(get_db)
):
    """Get specific user by ID (admin and manager only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(require_permission("manage:users")),
    db: Session = Depends(get_db)
):
    """Delete user account (admin and manager only)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account through this endpoint. Use /users/me instead."
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Менеджеры не могут удалять администраторов
    if current_user.is_manager() and not current_user.is_admin():
        if user.is_admin():
            raise HTTPException(
                status_code=403,
                detail="Managers cannot delete admin accounts"
            )
    
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user.username} deleted successfully"}