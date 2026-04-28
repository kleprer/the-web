FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    sqlalchemy \
    python-multipart \
    boto3 \
    python-dotenv \
    pydantic \
    pydantic-settings \
    python-jose \
    passlib \
    bcrypt \
    httpx \
    minio \
    email-validator \
    typing_extensions

COPY . .

WORKDIR /app/app

EXPOSE 8000

CMD ["sh", "-c", "python -c 'from database import engine; from models.models import Base; Base.metadata.create_all(bind=engine)' && python create_admin.py && uvicorn main:app --host 0.0.0.0 --port 8000"]