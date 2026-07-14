from collections.abc import Generator

from sqlalchemy.orm import Session

from app.database.session import get_db

DbSession = Generator[Session, None, None]

__all__ = ["DbSession", "get_db"]
