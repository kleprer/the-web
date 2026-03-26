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
from urllib.parse import quote
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
    """Проверка типа и размера файла"""
    # Проверка размера
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        return False, "file_too_large", f"Размер файла превышает {MAX_FILE_SIZE // (1024*1024)}MB"
    
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
    """Загрузка файла с указанием уровня доверия"""
    # Проверяем существование расследования
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Расследование не найдено")
    
    # Валидация файла
    is_valid, file_type, mime_type = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Ошибка валидации файла")
    
    # Генерируем уникальное имя файла
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
    # Определяем поддиректорию по типу файла
    subdir = ""
    if file_type == 'image':
        subdir = "images"
    elif file_type == 'document':
        subdir = "documents"
    elif file_type == 'media':
        subdir = "media"
    else:
        subdir = "other"
    
    # Создаем поддиректорию если не существует
    os.makedirs(os.path.join(UPLOAD_DIR, subdir), exist_ok=True)
    
    file_path = os.path.join(UPLOAD_DIR, subdir, unique_filename)
    
    # Сохраняем файл на диск
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"✅ Файл сохранен: {file_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения файла: {str(e)}")
    
    # Парсим теги
    try:
        tags_list = json.loads(tags) if tags else []
    except:
        tags_list = []
    
    # Создаем запись в базе данных
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
        uploaded_by=current_user.id if current_user else None
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file


@router.get("/filter")
def filter_files(
    investigation_id: int = Query(..., description="ID расследования"),
    search: Optional[str] = Query(None, description="Поиск по названию или имени файла"),
    trust_level: Optional[str] = Query(None, description="Фильтр по уровню доверия (high, unknown, low)"),
    file_type: Optional[str] = Query(None, description="Фильтр по типу файла (image, document, media, other)"),
    date_from: Optional[str] = Query(None, description="Фильтр от даты (ISO формат)"),
    date_to: Optional[str] = Query(None, description="Фильтр до даты (ISO формат)"),
    sort_by: Optional[str] = Query("date_desc", description="Поле сортировки и направление"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(12, ge=1, le=100, description="Количество элементов на странице"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение файлов с фильтрацией, сортировкой и пагинацией"""
    from schemas.file import FileResponse
    
    # Проверяем существование расследования
    investigation = db.query(models.Investigation).filter(
        models.Investigation.id == investigation_id
    ).first()
    
    if not investigation:
        raise HTTPException(status_code=404, detail="Расследование не найдено")
    
    # Формируем запрос
    query = db.query(models.File).filter(models.File.investigation_id == investigation_id)
    
    # Применяем фильтры
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
    
    # Применяем сортировку
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
    
    # Получаем общее количество
    total = query.count()
    
    # Применяем пагинацию
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


@router.get("/download-url/{file_id}")
def get_download_url(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Получение URL для скачивания файла"""
    print(f"🔗 Запрос ссылки для файла {file_id}")
    
    file_record = db.query(models.File).filter(models.File.id == file_id).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Возвращаем прямой URL для скачивания
    return {"url": f"/files/download/{file_id}"}


@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Скачивание файла"""
    print(f"📥 Запрос на скачивание файла {file_id}")
    
    # Получаем файл из базы данных
    file_record = db.query(models.File).filter(models.File.id == file_id).first()
    
    if not file_record:
        print(f"❌ Файл {file_id} не найден в базе данных")
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    print(f"📄 Файл найден: {file_record.filename}")
    print(f"   Путь: {file_record.file_path}")
    print(f"   Тип: {file_record.mime_type}")
    print(f"   Размер: {file_record.file_size} байт")
    
    # Проверяем существование файла на диске
    if not os.path.exists(file_record.file_path):
        print(f"❌ Файл не найден на диске по пути: {file_record.file_path}")
        
        # Пробуем найти файл в разных директориях
        filename = os.path.basename(file_record.file_path)
        possible_paths = [
            f"uploads/{filename}",
            f"uploads/images/{filename}",
            f"uploads/documents/{filename}",
            f"uploads/media/{filename}",
            f"uploads/other/{filename}",
        ]
        
        found = False
        for path in possible_paths:
            if os.path.exists(path):
                print(f"✅ Файл найден по альтернативному пути: {path}")
                file_record.file_path = path
                db.commit()
                found = True
                break
        
        if not found:
            raise HTTPException(status_code=404, detail="Файл не найден на сервере")
    
    print(f"✅ Отправка файла: {file_record.filename}")
    
    # Кодируем имя файла для заголовка Content-Disposition
    encoded_filename = quote(file_record.filename)
    
    # Отправляем файл с правильной кодировкой
    return FileResponse(
        path=file_record.file_path,
        filename=file_record.filename,
        media_type=file_record.mime_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        }
    )


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Удаление файла"""
    print(f"🗑️ Запрос на удаление файла {file_id}")
    
    # Получаем файл из базы данных
    file_record = db.query(models.File).filter(models.File.id == file_id).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Удаляем файл с диска
    if os.path.exists(file_record.file_path):
        try:
            os.remove(file_record.file_path)
            print(f"✅ Файл удален с диска: {file_record.file_path}")
        except Exception as e:
            print(f"⚠️ Не удалось удалить файл с диска: {e}")
    
    # Удаляем запись из базы данных
    db.delete(file_record)
    db.commit()
    
    print(f"✅ Файл {file_id} успешно удален")
    
    return {"message": "Файл успешно удален"}