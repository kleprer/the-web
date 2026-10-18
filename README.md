# Journalist Assistant

Веб-приложение для журналистских расследований: доска связей между фактами, хронология событий, хранилище доказательств, заметки и поиск.

**Стек:** FastAPI, SQLite, MinIO (backend); React, TypeScript, Ant Design (frontend); Docker Compose.

Подробное описание проекта: [docs/00-project.md](docs/00-project.md)

## Запуск

Требования: Git, Docker 24+ и Docker Compose v2.

```
git clone https://github.com/kleprer/the-web.git
cd the-web
cp .env.example .env
docker compose up --build -d
docker compose ps
```

В `.env` задайте `SECRET_KEY` и пароль MinIO. Для ленты новостей добавьте `NEWS_API_KEY` в `backend/.env` (без ключа эта функция отключена).

После запуска:
- приложение: http://localhost (через nginx) или http://localhost:3000
- API и Swagger: http://localhost:8000/docs
- консоль MinIO: http://localhost:9001

### Проверка работоспособности

1. `curl http://localhost:8000/health` возвращает `{"status":"healthy",...}`.
2. Откройте http://localhost и войдите: `user` / `user123`.
3. Создайте расследование на странице досок, откройте его и добавьте карточку. После обновления страницы карточка должна остаться.

### Версии инструментов

Python 3.11, Node 18 (в образе frontend), Docker 24+, Docker Compose v2.
Зависимости backend: `backend/requirements.txt`, frontend: `frontend/package-lock.json`.

### Протокол проверки запуска

| Дата | ОС | Кто проверял | Результат |
|---|---|---|---|
| [19/10/26] | [Windows 10] | [Максимова Снежана - frontend, требования, документация; Хуцаева Айса - backend, тестирование, документация] | [успешно] |

## Тесты

Тесты backend лежат в `backend/app/tests` (unit, integration, e2e). Запуск описан в `docs/04-testing.md` (заполняется в ЛР 5).

## Структура репозитория

- `backend/`, `frontend/` — исходный код (в курсовой структуре это `src/`)
- `docs/` — документация по лабораторным работам
- `tests/` — зарезервировано под тесты по структуре курса

## Синхронизация с upstream

Не требуется: проект собственный, не является форком.