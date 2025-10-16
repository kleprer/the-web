import os
import shutil
from fastapi import UploadFile, HTTPException
from datetime import datetime
import uuid

UPLOAD_DIR = "uploads"

# create upload directories if they don't exist
os.makedirs(f"{UPLOAD_DIR}/documents", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/images", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/media", exist_ok=True)

class FileStorage:
    @staticmethod
    def get_file_type(mime_type: str) -> str:
        """Categorize file by MIME type"""
        if mime_type.startswith('image/'):
            return 'image'
        elif mime_type.startswith('video/') or mime_type.startswith('audio/'):
            return 'media'
        else:
            return 'document'
    
    @staticmethod
    def save_file(upload_file: UploadFile, investigation_id: int) -> dict:
        """Save file to disk and return file info"""
        # generate unique filename
        file_ext = upload_file.filename.split('.')[-1] if '.' in upload_file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        # determine file type and directory
        file_type = FileStorage.get_file_type(upload_file.content_type)
        file_dir = f"{UPLOAD_DIR}/{file_type}s"
        file_path = os.path.join(file_dir, unique_filename)
        
        # save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        
        # get file size
        file_size = os.path.getsize(file_path)
        
        return {
            "filename": upload_file.filename,
            "file_path": file_path,
            "file_type": file_type,
            "mime_type": upload_file.content_type,
            "file_size": file_size
        }
    
    @staticmethod
    def delete_file(file_path: str):
        """Delete file from disk"""
        if os.path.exists(file_path):
            os.remove(file_path)
    
    @staticmethod
    def get_file_path(file_id: int, db) -> str:
        """Get file path from database"""
        from models import File
        file_record = db.query(File).filter(File.id == file_id).first()
        return file_record.file_path if file_record else None