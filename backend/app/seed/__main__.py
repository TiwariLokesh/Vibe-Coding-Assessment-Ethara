from app.core.config import get_settings
from app.database.session import SessionLocal
from app.seed.bootstrap import seed_database


def main() -> None:
    _ = get_settings()
    with SessionLocal() as session:
        seed_database(session)


if __name__ == "__main__":
    main()
