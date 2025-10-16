from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import models

router = APIRouter(prefix="/auth", tags=["authentication"])

class UserSignup(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    # check if user exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # create new user
    new_user = models.User(
        username=user.username,
        password=user.password,
        email=user.email
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "message": "User created successfully"
    }

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # find user in database
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    
    # check if user exists and password matches
    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Wrong username or password")
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "message": "Login successful"
    }