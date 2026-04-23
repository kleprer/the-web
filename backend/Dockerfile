FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копируем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем ВСЁ
COPY . .

# Устанавливаем PYTHONPATH в корень проекта
ENV PYTHONPATH=/app

# Создаем папку для uploads
RUN mkdir -p uploads

# Запускаем напрямую через python с правильным working directory
WORKDIR /app/app

CMD ["sh", "-c", "python -c 'from database import engine; from models.models import Base; Base.metadata.create_all(bind=engine)' && python create_admin.py && uvicorn main:app --host 0.0.0.0 --port 8000"]