from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.init_db import initialize_database
from app.database.session import SessionLocal


def startup_application() -> None:
    settings = get_settings()
    with SessionLocal() as session:
        initialize_database(session, seed=settings.seed_on_startup)
