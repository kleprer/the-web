from minio import Minio
from minio.error import S3Error
import os
import uuid
from typing import Optional, BinaryIO
import logging
from io import BytesIO
from datetime import timedelta

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self, endpoint: str, access_key: str, secret_key: str, bucket: str, secure: bool = False):
        self.endpoint = endpoint
        self.access_key = access_key
        self.secret_key = secret_key
        self.bucket = bucket
        self.secure = secure
        
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"✅ Бакет '{self.bucket}' создан")
            else:
                logger.info(f"✅ Бакет '{self.bucket}' уже существует")
        except S3Error as e:
            logger.error(f"❌ Ошибка создания бакета: {e}")
    
    def upload_file(self, file_data: bytes, filename: str, content_type: str) -> dict:
        file_ext = filename.split('.')[-1] if '.' in filename else ''
        file_key = f"files/{uuid.uuid4()}.{file_ext}"
        
        try:
            data_stream = BytesIO(file_data)
            
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=file_key,
                data=data_stream,
                length=len(file_data),
                content_type=content_type
            )
            
            logger.info(f"✅ Файл загружен в MinIO: {file_key} ({len(file_data)} байт)")
            
            return {
                'file_key': file_key,
                'file_path': f"s3://{self.bucket}/{file_key}"
            }
        except Exception as e:
            logger.error(f"❌ Ошибка загрузки: {e}")
            raise Exception(f"Ошибка загрузки файла: {e}")
    
    def download_file(self, file_key: str) -> bytes:
        """
        Скачивание файла из MinIO
        
        Args:
            file_key: Ключ файла в хранилище
        
        Returns:
            bytes: Содержимое файла
        """
        try:
            response = self.client.get_object(self.bucket, file_key)
            data = response.read()
            response.close()
            response.release_conn()
            logger.info(f"✅ Файл скачан из MinIO: {file_key} ({len(data)} байт)")
            return data
        except S3Error as e:
            logger.error(f"❌ Ошибка скачивания из MinIO: {e}")
            raise Exception(f"Ошибка скачивания файла: {e}")
        except Exception as e:
            logger.error(f"❌ Неожиданная ошибка при скачивании: {e}")
            raise Exception(f"Ошибка скачивания файла: {e}")
    
    def delete_file(self, file_key: str) -> bool:
        """Удаление файла из хранилища"""
        try:
            self.client.remove_object(self.bucket, file_key)
            logger.info(f"✅ Файл удален из MinIO: {file_key}")
            return True
        except S3Error as e:
            logger.error(f"❌ Ошибка удаления: {e}")
            return False
    
    def get_file_info(self, file_key: str) -> Optional[dict]:
        """Получение информации о файле"""
        try:
            stat = self.client.stat_object(self.bucket, file_key)
            return {
                'size': stat.size,
                'content_type': stat.content_type,
                'last_modified': stat.last_modified,
                'etag': stat.etag
            }
        except S3Error:
            return None