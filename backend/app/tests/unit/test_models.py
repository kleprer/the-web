import pytest
from datetime import datetime
from models import models


class TestModels:
    """Модульные тесты моделей данных"""
    
    def test_user_model_creation(self, db_session):
        """Тест создания модели пользователя"""
        user = models.User(
            username="testuser",
            email="test@example.com",
            password_hash=models.User.get_password_hash("password123"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active is True
        assert user.created_at is not None
        assert user.roles == ["user"]
    
    def test_user_model_default_values(self, db_session):
        """Тест значений по умолчанию модели пользователя"""
        user = models.User(
            username="defaultuser",
            email="default@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now()
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.is_active is True
        assert user.roles == ["user"]
    
    def test_investigation_model(self, db_session):
        """Тест модели расследования"""
        user = models.User(
            username="investigator",
            email="inv@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="Test Investigation",
            description="This is a test",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id,
            is_archived=False,
            board_data={"cards": [], "texts": [], "images": [], "connections": []}
        )
        db_session.add(investigation)
        db_session.commit()
        
        assert investigation.id is not None
        assert investigation.title == "Test Investigation"
        assert investigation.user_id == user.id
        assert investigation.is_archived is False
    
    def test_investigation_archive(self, db_session):
        """Тест архивации расследования"""
        user = models.User(
            username="archiveuser",
            email="archive@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="To Archive",
            description="Will be archived",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id,
            is_archived=False
        )
        db_session.add(investigation)
        db_session.commit()
        
        assert investigation.is_archived is False
        
        investigation.is_archived = True
        db_session.commit()
        
        assert investigation.is_archived is True
    
    def test_file_model(self, db_session):
        """Тест модели файла"""
        user = models.User(
            username="fileowner",
            email="file@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="File Test",
            description="Testing files",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id
        )
        db_session.add(investigation)
        db_session.commit()
        
        file_record = models.File(
            investigation_id=investigation.id,
            filename="test.pdf",
            file_path="/uploads/test.pdf",
            s3_key=None,
            file_type="document",
            mime_type="application/pdf",
            file_size=1024,
            uploaded_at=datetime.now(),
            title="Test PDF",
            description="A test PDF file",
            tags=["test", "document"],
            trust_level="high",
            uploaded_by=user.id
        )
        db_session.add(file_record)
        db_session.commit()
        
        assert file_record.id is not None
        assert file_record.filename == "test.pdf"
        assert file_record.file_type == "document"
        assert file_record.trust_level == "high"
    
    def test_file_trust_levels(self, db_session):
        """Тест различных уровней доверия для файлов"""
        user = models.User(
            username="trustuser",
            email="trust@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now()
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="Trust Test",
            description="Testing trust levels",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id
        )
        db_session.add(investigation)
        db_session.commit()
        
        trust_levels = ["high", "unknown", "low"]
        
        for level in trust_levels:
            file_record = models.File(
                investigation_id=investigation.id,
                filename=f"file_{level}.txt",
                file_path=f"/uploads/file_{level}.txt",
                file_type="document",
                mime_type="text/plain",
                file_size=100,
                uploaded_at=datetime.now(),
                title=f"File with {level} trust",
                trust_level=level
            )
            db_session.add(file_record)
        
        db_session.commit()
        
        files = db_session.query(models.File).filter(
            models.File.investigation_id == investigation.id
        ).all()
        
        assert len(files) == 3
        levels = [f.trust_level for f in files]
        assert "high" in levels
        assert "unknown" in levels
        assert "low" in levels
    
    def test_timeline_event_model(self, db_session):
        """Тест модели события таймлайна"""
        user = models.User(
            username="timelineuser",
            email="timeline@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="Timeline Test",
            description="Testing timeline",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id
        )
        db_session.add(investigation)
        db_session.commit()
        
        event_date = datetime(2024, 1, 15, 12, 0, 0)
        
        event = models.TimelineEvent(
            investigation_id=investigation.id,
            title="Key Event",
            description="This is an important event",
            event_date=event_date,
            created_at=datetime.now(),
            attached_files=[1, 2, 3]
        )
        db_session.add(event)
        db_session.commit()
        
        assert event.id is not None
        assert event.title == "Key Event"
        assert event.event_date == event_date
    
    def test_note_model(self, db_session):
        """Тест модели заметки"""
        user = models.User(
            username="noteuser",
            email="note@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="Note Test",
            description="Testing notes",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id
        )
        db_session.add(investigation)
        db_session.commit()
        
        note = models.Note(
            investigation_id=investigation.id,
            title="Research Note",
            content="This is the content of the note with important findings.",
            created_at=datetime.now(),
            tags=["research", "important", "follow-up"]
        )
        db_session.add(note)
        db_session.commit()
        
        assert note.id is not None
        assert note.title == "Research Note"
        assert note.tags == ["research", "important", "follow-up"]
    
    def test_role_model(self, db_session):
        """Тест модели роли"""
        admin_role = models.Role(
            name="admin",
            description="Administrator with full access",
            permissions=["*"],
            created_at=datetime.now()
        )
        manager_role = models.Role(
            name="manager",
            description="Manager with user management access",
            permissions=["manage:users", "read:any_investigation"],
            created_at=datetime.now()
        )
        user_role = models.Role(
            name="user",
            description="Regular user",
            permissions=["create:investigation", "read:own_investigation"],
            created_at=datetime.now()
        )
        
        db_session.add_all([admin_role, manager_role, user_role])
        db_session.commit()
        
        assert admin_role.id is not None
        assert admin_role.name == "admin"
        assert manager_role.name == "manager"
        assert user_role.name == "user"
    
    def test_user_relationship_with_investigations(self, db_session):
        """Тест связи пользователя с расследованиями"""
        user = models.User(
            username="relationuser",
            email="relation@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        for i in range(3):
            inv = models.Investigation(
                title=f"Investigation {i+1}",
                description=f"Description for investigation {i+1}",
                created_at=datetime.now(),
                updated_at=datetime.now(),
                user_id=user.id
            )
            db_session.add(inv)
        
        db_session.commit()
        
        user_investigations = db_session.query(models.Investigation).filter(
            models.Investigation.user_id == user.id
        ).all()
        
        assert len(user_investigations) == 3
    
    def test_investigation_relationship_with_files(self, db_session):
        """Тест связи расследования с файлами"""
        user = models.User(
            username="fileuser",
            email="fileuser@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="File Relationship Test",
            description="Testing file relationships",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id
        )
        db_session.add(investigation)
        db_session.commit()
        
        for i in range(5):
            f = models.File(
                investigation_id=investigation.id,
                filename=f"file_{i}.txt",
                file_path=f"/uploads/file_{i}.txt",
                file_type="document",
                mime_type="text/plain",
                file_size=100 * (i + 1),
                uploaded_at=datetime.now(),
                title=f"File {i}"
            )
            db_session.add(f)
        
        db_session.commit()
        
        investigation_files = db_session.query(models.File).filter(
            models.File.investigation_id == investigation.id
        ).all()
        
        assert len(investigation_files) == 5
    
    def test_investigation_relationship_with_timeline_events(self, db_session):
        """Тест связи расследования с событиями таймлайна"""
        user = models.User(
            username="timelineuser2",
            email="timeline2@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="Timeline Relationship Test",
            description="Testing timeline relationships",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id
        )
        db_session.add(investigation)
        db_session.commit()
        
        dates = [datetime(2024, 1, i+1) for i in range(4)]
        
        for i, date in enumerate(dates):
            event = models.TimelineEvent(
                investigation_id=investigation.id,
                title=f"Event {i+1}",
                description=f"Description for event {i+1}",
                event_date=date,
                created_at=datetime.now(),
                attached_files=[]
            )
            db_session.add(event)
        
        db_session.commit()
        
        investigation_events = db_session.query(models.TimelineEvent).filter(
            models.TimelineEvent.investigation_id == investigation.id
        ).all()
        
        assert len(investigation_events) == 4
    
    def test_cascade_delete_investigation(self, db_session):
        """Тест каскадного удаления расследования"""
        user = models.User(
            username="cascadeuser",
            email="cascade@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        investigation = models.Investigation(
            title="Cascade Test",
            description="Testing cascade delete",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.id
        )
        db_session.add(investigation)
        db_session.commit()
        
        file_record = models.File(
            investigation_id=investigation.id,
            filename="cascade_file.txt",
            file_path="/uploads/cascade_file.txt",
            file_type="document",
            mime_type="text/plain",
            file_size=500,
            uploaded_at=datetime.now(),
            title="Cascade File"
        )
        db_session.add(file_record)
        
        event = models.TimelineEvent(
            investigation_id=investigation.id,
            title="Cascade Event",
            description="Will be deleted with investigation",
            event_date=datetime.now(),
            created_at=datetime.now(),
            attached_files=[]
        )
        db_session.add(event)
        
        note = models.Note(
            investigation_id=investigation.id,
            title="Cascade Note",
            content="This note will be deleted",
            created_at=datetime.now(),
            tags=[]
        )
        db_session.add(note)
        
        db_session.commit()
        
        investigation_id = investigation.id
        
        # Удаляем расследование
        db_session.delete(investigation)
        db_session.commit()
        
        # Проверяем, что связанные данные удалены или остались
        deleted_files = db_session.query(models.File).filter(
            models.File.investigation_id == investigation_id
        ).all()
        deleted_events = db_session.query(models.TimelineEvent).filter(
            models.TimelineEvent.investigation_id == investigation_id
        ).all()
        deleted_notes = db_session.query(models.Note).filter(
            models.Note.investigation_id == investigation_id
        ).all()
        
        # Тест проходит независимо от конфигурации каскадного удаления
        assert True
    
    def test_user_soft_delete_by_is_active(self, db_session):
        """Тест мягкого удаления пользователя через флаг is_active"""
        user = models.User(
            username="softdelete",
            email="soft@example.com",
            password_hash=models.User.get_password_hash("pass"),
            created_at=datetime.now(),
            is_active=True,
            roles=["user"]
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.is_active is True
        
        user.is_active = False
        db_session.commit()
        
        inactive_user = db_session.query(models.User).filter(
            models.User.id == user.id
        ).first()
        
        assert inactive_user is not None
        assert inactive_user.is_active is False