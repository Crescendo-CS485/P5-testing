import logging
logging.basicConfig(level=logging.INFO)
logging.getLogger("apscheduler").setLevel(logging.DEBUG)

from app import create_app, db
from app.seed import seed

app = create_app()

with app.app_context():
    db.create_all()
    seed()

if __name__ == "__main__":
    app.run(port=5001, debug=True, use_reloader=False)
