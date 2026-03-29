from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()


def create_app(test_config=None):
    app = Flask(__name__)
    if test_config:
        app.config.from_mapping(test_config)
    else:
        app.config.from_object("config.Config")
    
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_HTTPONLY"] = True

    db.init_app(app)
    CORS(app)

    from .routes import bp
    app.register_blueprint(bp)

    from .auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    from .list_routes import list_bp
    app.register_blueprint(list_bp)

    from .scheduler import init_scheduler
    init_scheduler(app)

    return app
