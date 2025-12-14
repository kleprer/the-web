from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import models
from schemas.user import UserResponse
from dependencies.auth import get_current_user

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
    username: str = None,
    email: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    if username:
        # Check if username is already taken by another user
        existing_user = db.query(models.User).filter(
            models.User.username == username,
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        current_user.username = username
    
    if email:
        # Check if email is already taken by another user
        existing_user = db.query(models.User).filter(
            models.User.email == email,
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")
        
        current_user.email = email
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile updated successfully", "user": current_user}

@router.delete("/me")
def delete_my_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user account"""
    # Archive user's investigations instead of deleting them?
    # Or actually delete everything?
    
    # For now, just mark as inactive
    current_user.is_active = False
    db.commit()
    
    return {"message": "Account deactivated successfully"}

# Admin only endpoints (for backward compatibility)
@router.get("/", response_model=list[UserResponse])
def get_all_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    # Check if user is admin (you can add admin field to User model)
    # For now, return only current user
    return [current_user]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific user by ID"""
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="You can only view your own profile"
        )
    
    user = db.query(models.User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account (admin or self)"""
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own account"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}