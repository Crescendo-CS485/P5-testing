"""
Shared fixtures for P5 test suite.

- Uses SQLite in-memory so no external DB needed.
- Patches APScheduler to a no-op / mock.
- Session-scoped app context keeps the DB alive across all tests.
- clean_tables auto-fixture resets every table after each test.
"""

import os
import sys

# backend/ on path so `from app import ...` works
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone, date


@pytest.fixture(scope="session")
def app():
    with patch("app.scheduler.init_scheduler"):
        from app import create_app
        application = create_app()

    application.config["TESTING"] = True
    application.config["SECRET_KEY"] = "test-secret"

    import app.scheduler as sched_module
    sched_module.scheduler = MagicMock()

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
    """Delete all rows after every test for isolation."""
    yield
    from app import db
    from app.models import (
        LLMJob, Post, ListAlbum, List, Discussion,
        LLMPersona, Album, User, Artist, Genre,
    )
    # Order matters: children before parents
    db.session.query(LLMJob).delete()
    db.session.query(Post).delete()
    db.session.query(ListAlbum).delete()
    db.session.query(List).delete()
    db.session.query(Discussion).delete()
    db.session.query(LLMPersona).delete()
    db.session.query(Album).delete()
    # Clear M2M association tables
    db.session.execute(db.text("DELETE FROM artist_genres"))
    db.session.execute(db.text("DELETE FROM album_genres"))
    db.session.query(User).delete()
    db.session.query(Artist).delete()
    db.session.query(Genre).delete()
    db.session.commit()


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

@pytest.fixture
def make_genre(app):
    def _make(name="Rock"):
        from app import db
        from app.models import Genre
        g = Genre(name=name)
        db.session.add(g)
        db.session.flush()
        return g
    return _make


@pytest.fixture
def make_artist(app):
    def _make(name="Luna Rivera", activity_score=9.4, discussion_count=5,
              image_url="https://img.com/luna.jpg", bio="Singer",
              genres=None, latest_thread_title=None, latest_thread_timestamp=None):
        from app import db
        from app.models import Artist
        a = Artist(
            name=name,
            activity_score=activity_score,
            discussion_count=discussion_count,
            image_url=image_url,
            bio=bio,
            latest_thread_title=latest_thread_title,
            latest_thread_timestamp=latest_thread_timestamp,
        )
        if genres:
            a.genres = genres
        db.session.add(a)
        db.session.flush()
        return a
    return _make


@pytest.fixture
def make_user(app):
    def _make(display_name="Alice", handle="@alice", is_bot=False,
              bot_label=None, email=None, password_hash=None):
        from app import db
        from app.models import User
        u = User(
            display_name=display_name,
            handle=handle,
            is_bot=is_bot,
            bot_label=bot_label,
            email=email,
            password_hash=password_hash,
        )
        db.session.add(u)
        db.session.flush()
        return u
    return _make


@pytest.fixture
def make_discussion(app):
    def _make(artist_id, author_user_id, title="Test discussion",
              post_count=0, last_activity_at=None):
        from app import db
        from app.models import Discussion
        d = Discussion(
            artist_id=artist_id,
            author_user_id=author_user_id,
            title=title,
            post_count=post_count,
            last_activity_at=last_activity_at or datetime.now(timezone.utc),
        )
        db.session.add(d)
        db.session.flush()
        return d
    return _make


@pytest.fixture
def make_post(app):
    def _make(discussion_id, author_user_id, body="Test post", is_deleted=False):
        from app import db
        from app.models import Post
        p = Post(
            discussion_id=discussion_id,
            author_user_id=author_user_id,
            body=body,
            is_deleted=is_deleted,
        )
        db.session.add(p)
        db.session.flush()
        return p
    return _make


@pytest.fixture
def make_album(app):
    def _make(title="Ctrl", artist_id=None, release_date=None,
              release_year=2017, user_score=9.0, critic_score=8.5,
              review_count=100, album_type="studio", genres=None):
        from app import db
        from app.models import Album
        a = Album(
            title=title,
            artist_id=artist_id,
            release_date=release_date or date(2017, 6, 9),
            release_year=release_year,
            user_score=user_score,
            critic_score=critic_score,
            review_count=review_count,
            album_type=album_type,
        )
        if genres:
            a.genres = genres
        db.session.add(a)
        db.session.flush()
        return a
    return _make


@pytest.fixture
def make_persona(app):
    def _make(user_id, name="TestBot", engagement_style="enthusiastic music fan"):
        from app import db
        from app.models import LLMPersona
        p = LLMPersona(
            user_id=user_id,
            name=name,
            engagement_style=engagement_style,
        )
        db.session.add(p)
        db.session.flush()
        return p
    return _make
