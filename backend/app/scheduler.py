from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

scheduler = None

# Flask app reference stored here so background jobs can push an app context
_flask_app = None


def init_scheduler(app):
    global _flask_app, scheduler
    _flask_app = app

    db_url = app.config["SQLALCHEMY_DATABASE_URI"]
    jobstores = {
        "default": SQLAlchemyJobStore(url=db_url),
    }
    scheduler = BackgroundScheduler(jobstores=jobstores)
    if app.config.get("TESTING"):
        app.logger.info("APScheduler disabled in TESTING mode.")
        return

    if not scheduler.running:
        scheduler.start()
        app.logger.info("APScheduler started with SQLAlchemy job store.")


def get_flask_app():
    return _flask_app
