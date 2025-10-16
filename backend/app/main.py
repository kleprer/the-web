from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from models import models
from database import engine, get_db
from api.auth import router as auth_router
from api.auth import router as auth_router
from api.investigation import router as investigations_router
from api.files import router as files_router
from api.timeline import router as timelines_router
from api.note import router as notes_router
from api.search import router as search_router
from api.files import router as files_router
from api.user import router as user_router


# create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Journalist Assistant API")

app.include_router(auth_router)
app.include_router(investigations_router)
app.include_router(timelines_router)
app.include_router(files_router)
app.include_router(search_router)
app.include_router(notes_router)
app.include_router(user_router)
