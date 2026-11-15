"""Проверки контракта создания расследования: US-2 / FR-2."""
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from models.models import Investigation


def test_create_investigation_success(api):
    client, engine = api
    payload = {"title": "Закупка автобусов", "description": "Контракт № 17"}

    response = client.post("/investigations/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["id"], int) and data["id"] > 0
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["user_id"] == 3
    assert data["is_archived"] is False
    assert data["board_data"] == {
        "cards": [], "texts": [], "images": [], "connections": []
    }
    for field in ("created_at", "updated_at"):
        assert isinstance(data[field], str)
        datetime.fromisoformat(data[field])

    # Отдельная сессия подтверждает, что операция действительно сохранила запись.
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(Investigation)) == 1
        saved = session.get(Investigation, data["id"])
        assert saved.title == payload["title"]
        assert saved.description == payload["description"]
        assert saved.user_id == 3
        assert saved.board_data == data["board_data"]
        assert saved.is_archived is False


def test_create_investigation_without_title(api):
    client, engine = api
    payload = {"description": "Контракт № 17"}

    response = client.post("/investigations/", json=payload)

    assert response.status_code == 400
    errors = response.json()["detail"]
    assert any(
        error["type"] == "missing" and error["loc"] == ["body", "title"]
        for error in errors
    )
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(Investigation)) == 0


def test_create_investigation_without_description(api):
    client, engine = api
    payload = {"title": "Закупка автобусов"}

    response = client.post("/investigations/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == ""
    with Session(engine) as session:
        saved = session.get(Investigation, data["id"])
        assert saved is not None
        assert saved.description == ""


def test_create_investigation_ignores_supplied_user_id(api):
    client, engine = api
    payload = {
        "title": "Закупка автобусов",
        "description": "Контракт № 17",
        "user_id": 999,
    }

    response = client.post("/investigations/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 3
    with Session(engine) as session:
        saved = session.get(Investigation, data["id"])
        assert saved is not None
        assert saved.user_id == 3
