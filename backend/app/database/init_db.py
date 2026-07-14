from sqlalchemy.orm import Session

from app.models import Base
from app.seed.bootstrap import seed_database


def initialize_database(session: Session, seed: bool = False) -> None:
    Base.metadata.create_all(bind=session.get_bind())
    if seed:
        seed_database(session)
