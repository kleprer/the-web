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
В GitHub Actions используется Node 20 (npm 10); `frontend/package-lock.json` пересобирается командой `npx npm@10 install --package-lock-only`.

### Протокол проверки запуска

| Дата | ОС | Кто проверял | Результат |
|---|---|---|---|
| [19/10/26] | [Windows 10] | [Максимова Снежана - frontend, требования, документация; Хуцаева Айса - backend, тестирование, документация] | [успешно] |

## Тесты

### Лабораторная работа 4: создание расследования

Тесты `tests/test_investigation_contract.py` проверяют операцию `POST /investigations/`
по [контракту ЛР 3](docs/interface-contract.md), сценарий US-2 и требование FR-2:

- Название «Закупка автобусов», описание «Контракт № 17»: код 200, поля ответа,
  владелец, пустая доска и сохранение записи в базе.
- Запрос без `title`: код 422, ошибка `missing` для `body.title`, отсутствие записи в базе.
- Запрос без `description`: код 200, описание сохраняется как пустая строка.
- Запрос с чужим `user_id` в теле: поле игнорируется, владельцем становится текущий пользователь.

Используется настоящий роутер FastAPI и новая SQLite в памяти для каждого теста.
Авторизация заменена заглушкой пользователя с ID 3; проверка токенов в эти тесты
не входит. `main.py` не импортируется, рабочая база не используется.
Docker, MinIO, сервер приложения и внешние сервисы запускать не нужно.

Команды выполняются из корня проекта. Рекомендуется Python 3.11 или 3.12.

**Windows PowerShell:**

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe -m pytest tests/test_investigation_contract.py -v
```

Если установлен Python 3.12, в первой команде замените `-3.11` на `-3.12`.

**Linux / WSL:**

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m pytest tests/test_investigation_contract.py -v
```

Ожидаемый результат: `4 passed`. Команда запускает только тесты контракта.
Прежние тесты backend находятся отдельно в `backend/app/tests`.

### GitHub Actions

Workflow `.github/workflows/lab-4.yml` запускается по событию `pull_request` в `main`:
открытие PR (`opened`), новые коммиты (`synchronize`) и повторное открытие (`reopened`).
Источник: [GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).

Два независимых задания:

1. **Backend tests (pytest)**: Python 3.11, `pip install -r backend/requirements.txt`,
   `python -m pytest tests/test_investigation_contract.py -v`.
2. **Frontend build check** (дополнительная проверка): Node.js 20, `npm ci`,
   `npm run build` с `CI=true`. При такой настройке предупреждения ESLint считаются
   ошибками, так же как при сборке на Vercel.

Проверка сборки локально (из корня проекта):

```bash
cd frontend
npm ci
CI=true npm run build        # Windows PowerShell: $env:CI="true"; npm run build
```

Существующий `ci-cd.yml` (Docker-сборка и деплой) не менялся и работает отдельно.

## Структура репозитория

- `backend/`, `frontend/` — исходный код (в курсовой структуре это `src/`)
- `docs/` — документация по лабораторным работам
- `tests/` — зарезервировано под тесты по структуре курса

## Синхронизация с upstream

Не требуется: проект собственный, не является форком.

## Статус требований

Критерии приёмки и сценарии приведены в [описании проекта и требований](docs/01-requirements.md).

| Номер | Краткая формулировка | Приоритет | Состояние |
|---|---|---|---|
| FR-1 | Вход | обязательно в этом семестре | уже есть |
| FR-2 | Создание расследования | обязательно в этом семестре | уже есть |
| FR-3 | Доска связей | обязательно в этом семестре | уже есть |
| FR-4 | Хронология | обязательно в этом семестре | уже есть |
| FR-5 | Файлы доказательств | обязательно в этом семестре | уже есть |
| FR-6 | Заметки | желательно | нужно доработать |
| FR-7 | Общий поиск | желательно | нужно доработать |
| FR-8 | Назначение ролей | обязательно в этом семестре | уже есть |
| FR-9 | Регистрация журналиста | обязательно в этом семестре | уже есть |
| FR-10 | Архивирование и восстановление расследования | обязательно в этом семестре | нужно доработать |
| NFR-1 | Разграничение доступа | обязательно в этом семестре | уже есть |
| NFR-2 | Защита данных входа | обязательно в этом семестре | нужно доработать |
| NFR-3 | Развёртывание | обязательно в этом семестре | уже есть |