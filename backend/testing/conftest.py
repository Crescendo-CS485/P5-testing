"""
Shared fixtures for all user story tests.

Setup strategy:
- DATABASE_URL is overridden to SQLite in-memory before any app import.
- APScheduler's init_scheduler is patched to a no-op so no background thread starts.
- app.scheduler.scheduler is replaced with a MagicMock so StaggerScheduler.schedule_jobs()
  can call scheduler.add_job() without a real APScheduler instance.
- A single app context is pushed for the entire test session (keeps the in-memory
  SQLite connection alive and avoids nested-context teardown issues).
- clean_tables runs after every test to reset DB state.
"""

import os
import sys

# Add backend/ to path so "from app import ..." works when running pytest from testing/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Override DATABASE_URL before config.py is imported.
# load_dotenv() uses override=False by default, so this env var won't be clobbered.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture(scope="session")
def app():
    with patch("app.scheduler.init_scheduler"):
        from app import create_app

        application = create_app()

    application.config["TESTING"] = True

    # Give stagger_scheduler a mock scheduler so add_job() calls succeed.
    import app.scheduler as sched_module
    sched_module.scheduler = MagicMock()

    # Push one app context for the whole session so the SQLite in-memory DB persists.
    ctx = application.app_context()
    ctx.push()

    from app import db
    db.create_all()

    yield application

    db.session.remove()
    db.drop_all()
    ctx.pop()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_tables(app):
    """Delete all rows after every test to ensure isolation."""
    yield
    from app import db
    from app.models import LLMJob, Post, Discussion, LLMPersona, User, Artist, Genre

    db.session.query(LLMJob).delete()
    db.session.query(Post).delete()
    db.session.query(Discussion).delete()
    db.session.query(LLMPersona).delete()
    db.session.query(User).delete()
    db.session.query(Artist).delete()
    db.session.query(Genre).delete()
    db.session.commit()
