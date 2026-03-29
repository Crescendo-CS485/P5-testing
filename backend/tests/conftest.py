import pytest
from app import create_app, db
from app.models import Genre

@pytest.fixture
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "SECRET_KEY": "test-secret",
        "WTF_CSRF_ENABLED": False,
    })

    with app.app_context():
        db.create_all()
        # Seed basic data for tests if needed
        g1 = Genre(name="Rock")
        g2 = Genre(name="Pop")
        db.session.add_all([g1, g2])
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()
