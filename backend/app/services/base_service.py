from __future__ import annotations

from abc import ABC
from sqlalchemy.orm import Session


class BaseService(ABC):
    def __init__(self, session: Session) -> None:
        self.session = session
