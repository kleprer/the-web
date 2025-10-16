from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from fastapi import File as FastAPIFile  # Rename to avoid conflict
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid
import shutil
from database import get_db
from models.models import File, Investigation

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/{investigation_id}")
async def upload_file(
    investigation_id: int,
    file: UploadFile,  # Remove the = File(...) part
    title: str = Form(None),
    description: str = Form(None),
    tags: str = Form("[]"),
    db: Session = Depends(get_db)
):
    """Upload ANY type of file - documents, images, etc."""
    # Verify investigation exists
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Determine file type category
    mime_type = file.content_type or "application/octet-stream"
    if mime_type.startswith('image/'):
        file_type = 'image'
    elif mime_type in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
        file_type = 'document'
    elif mime_type.startswith('video/') or mime_type.startswith('audio/'):
        file_type = 'media'
    else:
        file_type = 'other'
    
    # Create file record
    db_file = File(
        investigation_id=investigation_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        mime_type=mime_type,
        file_size=os.path.getsize(file_path),
        uploaded_at=datetime.now(),
        title=title or file.filename,
        description=description,
        tags=tags
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return {
        "id": db_file.id,
        "filename": db_file.filename,
        "file_type": db_file.file_type,
        "title": db_file.title,
        "message": "File uploaded successfully"
    }

@router.get("/")
def get_files(investigation_id: int, file_type: str = None, db: Session = Depends(get_db)):
    """Get files - filter by type if needed"""
    query = db.query(File).filter(File.investigation_id == investigation_id)
    
    if file_type:
        query = query.filter(File.file_type == file_type)
    
    files = query.order_by(File.uploaded_at.desc()).all()
    return files

@router.get("/download/{file_id}")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    """Download any file"""
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=file_record.file_path,
        filename=file_record.filename,
        media_type=file_record.mime_type
    )

@router.get("/documents/{investigation_id}")
def get_documents(investigation_id: int, db: Session = Depends(get_db)):
    """Get only documents (PDFs, Word docs, etc.)"""
    return get_files(investigation_id, file_type='document', db=db)

@router.get("/images/{investigation_id}")
def get_images(investigation_id: int, db: Session = Depends(get_db)):
    """Get only images"""
    return get_files(investigation_id, file_type='image', db=db)

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    """Delete any file"""
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete from disk
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)
    
    # Delete from database
    db.delete(file_record)
    db.commit()
    
    return {"message": "File deleted successfully"}