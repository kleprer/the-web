from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from datetime import datetime
import os
import uuid
import shutil
import json
from typing import List, Optional
from database import get_db
from models import models
from schemas.file import FileResponse as FileResponseSchema, FileUpdate
from dependencies.auth import get_current_user

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Допустимые типы и размеры файлов
ALLOWED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'document': ['application/pdf', 'application/msword', 
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                 'text/plain'],
    'media': ['video/mp4', 'audio/mpeg', 'audio/mp3']
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


def validate_file(file: UploadFile) -> tuple[bool, str, str]:
    """Validate file type and size"""
    # Проверка размера
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        return False, "file_too_large", f"File size exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit"
    
    # Проверка типа
    mime_type = file.content_type or "application/octet-stream"
    
    # Определяем тип файла
    if mime_type.startswith('image/'):
        file_type = 'image'
    elif mime_type in ALLOWED_MIME_TYPES['document']:
        file_type = 'document'
    elif mime_type.startswith('video/') or mime_type.startswith('audio/'):
        file_type = 'media'
    else:
        file_type = 'other'
    
    return True, file_type, mime_type


@router.post("/upload/{investigation_id}", response_model=FileResponseSchema)
async def upload_file(
    investigation_id: int,
    file: UploadFile = File(...),
    title: str = Form(None),
    description: str = Form(None),
    tags: str = Form("[]"),
    trust_level: str = Form("unknown"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload ANY type of file with trust level"""
    # Проверка прав
    if not current_user.has_permission("upload:file"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify investigation exists and user has access
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # Проверка прав доступа к расследованию
    if investigation.user_id != current_user.id and not current_user.has_permission("read:any_investigation"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Валидация файла
    is_valid, file_type, mime_type = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail="File validation failed")
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Parse tags
    try:
        tags_list = json.loads(tags) if tags else []
    except:
        tags_list = []
    
    # Create file record
    db_file = models.File(
        investigation_id=investigation_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        mime_type=mime_type,
        file_size=os.path.getsize(file_path),
        uploaded_at=datetime.now(),
        title=title or file.filename,
        description=description,
        tags=tags_list,
        trust_level=trust_level,
        uploaded_by=current_user.id
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file


@router.get("/filter")
def filter_files(
    investigation_id: int = Query(..., description="ID of the investigation"),
    search: Optional[str] = Query(None, description="Search by title or filename"),
    trust_level: Optional[str] = Query(None, description="Filter by trust level (high, unknown, low)"),
    file_type: Optional[str] = Query(None, description="Filter by file type (image, document, media, other)"),
    date_from: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter to date (ISO format)"),
    sort_by: Optional[str] = Query("date_desc", description="Sort field and direction"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=100, description="Items per page"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get files with filtering, sorting and pagination"""
    from schemas.file import FileResponse
    
    # Проверка прав
    if not current_user.has_permission("read:any_investigation"):
        if not current_user.has_permission("read:own_investigation"):
            raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify investigation exists and user has access
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # Проверка прав доступа к расследованию
    if investigation.user_id != current_user.id and not current_user.has_permission("read:any_investigation"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = db.query(models.File).filter(models.File.investigation_id == investigation_id)
    
    # Apply filters
    if search:
        query = query.filter(
            or_(
                models.File.title.ilike(f"%{search}%"),
                models.File.filename.ilike(f"%{search}%"),
                models.File.description.ilike(f"%{search}%")
            )
        )
    
    if trust_level:
        query = query.filter(models.File.trust_level == trust_level)
    
    if file_type:
        query = query.filter(models.File.file_type == file_type)
    
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from)
            query = query.filter(models.File.uploaded_at >= from_date)
        except:
            pass
    
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to)
            query = query.filter(models.File.uploaded_at <= to_date)
        except:
            pass
    
    # Apply sorting
    from sqlalchemy import asc, desc
    sort_mapping = {
        "date_asc": asc(models.File.uploaded_at),
        "date_desc": desc(models.File.uploaded_at),
        "name_asc": asc(models.File.title),
        "name_desc": desc(models.File.title),
        "size_asc": asc(models.File.file_size),
        "size_desc": desc(models.File.file_size),
        "trust_asc": asc(models.File.trust_level),
        "trust_desc": desc(models.File.trust_level)
    }
    
    if sort_by in sort_mapping:
        query = query.order_by(sort_mapping[sort_by])
    else:
        query = query.order_by(desc(models.File.uploaded_at))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    files = query.offset(offset).limit(limit).all()
    
    # Сериализуем через Pydantic схему
    serialized_files = [FileResponse.model_validate(f) for f in files]
    
    return {
        "items": serialized_files,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "limit": limit
    }


@router.get("/", response_model=List[FileResponseSchema])
def get_files(
    investigation_id: int = Query(..., description="ID of the investigation"),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get files for an investigation (legacy endpoint)"""
    # Проверка прав
    if not current_user.has_permission("upload:file"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    if investigation.user_id != current_user.id and not current_user.has_permission("read:any_investigation"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(models.File).filter(models.File.investigation_id == investigation_id)
    
    if file_type:
        query = query.filter(models.File.file_type == file_type)
    
    files = query.order_by(models.File.uploaded_at.desc()).all()
    return files


@router.get("/download-url/{file_id}")
def get_download_url(
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pre-signed URL for file download (for S3 integration)"""
    # Проверка прав
    if not current_user.has_permission("upload:file"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    file_record = db.query(models.File).join(
        models.Investigation,
        models.Investigation.id == models.File.investigation_id
    ).filter(
        models.File.id == file_id
    ).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверка прав доступа к файлу
    if file_record.investigation.user_id != current_user.id and not current_user.has_permission("read:any_investigation"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Для локального хранения возвращаем прямой URL
    # Для S3 здесь можно генерировать pre-signed URL
    return {"url": f"/files/download/{file_id}"}


@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download any file"""
    # Проверка прав
    if not current_user.has_permission("upload:file"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    file_record = db.query(models.File).join(
        models.Investigation,
        models.Investigation.id == models.File.investigation_id
    ).filter(
        models.File.id == file_id
    ).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверка прав доступа к файлу
    if file_record.investigation.user_id != current_user.id and not current_user.has_permission("read:any_investigation"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=file_record.file_path,
        filename=file_record.filename,
        media_type=file_record.mime_type
    )


@router.put("/{file_id}", response_model=FileResponseSchema)
def update_file_metadata(
    file_id: int,
    file_data: FileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update file metadata (title, description, tags, trust_level)"""
    file_record = db.query(models.File).join(
        models.Investigation,
        models.Investigation.id == models.File.investigation_id
    ).filter(
        models.File.id == file_id
    ).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверка прав доступа к файлу
    if file_record.investigation.user_id != current_user.id and not current_user.has_permission("update:any_file"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update fields
    if file_data.title is not None:
        file_record.title = file_data.title
    if file_data.description is not None:
        file_record.description = file_data.description
    if file_data.tags is not None:
        file_record.tags = file_data.tags
    if file_data.trust_level is not None:
        file_record.trust_level = file_data.trust_level
    
    db.commit()
    db.refresh(file_record)
    
    return file_record


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete any file"""
    
    # Получаем файл
    file_record = db.query(models.File).filter(models.File.id == file_id).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Получаем расследование для проверки прав
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == file_record.investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # Проверка прав доступа к файлу
    if investigation.user_id != current_user.id and not current_user.has_permission("delete:any_file"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete from disk
    if os.path.exists(file_record.file_path):
        try:
            os.remove(file_record.file_path)
        except Exception as e:
            print(f"Warning: Could not delete file from disk: {e}")
    
    # Delete from database
    db.delete(file_record)
    db.commit()
    
    return {"message": "File deleted successfully"}


# Legacy endpoints for backward compatibility
@router.get("/investigation/{investigation_id}", response_model=List[FileResponseSchema])
def get_files_by_investigation(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get files for an investigation (legacy endpoint)"""
    return get_files(investigation_id=investigation_id, current_user=current_user, db=db)


@router.get("/documents/{investigation_id}", response_model=List[FileResponseSchema])
def get_documents(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get only documents (PDFs, Word docs, etc.)"""
    return get_files(investigation_id=investigation_id, file_type='document', current_user=current_user, db=db)


@router.get("/images/{investigation_id}", response_model=List[FileResponseSchema])
def get_images(
    investigation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get only images"""
    return get_files(investigation_id=investigation_id, file_type='image', current_user=current_user, db=db)