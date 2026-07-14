from __future__ import annotations

from app.models.seat import Seat
from app.services.base_service import BaseService
from app.services.repositories.seat_repository import SeatRepository


class SeatService(BaseService):
    def __init__(self, session) -> None:
        super().__init__(session)
        self.seat_repository = SeatRepository(session)

    def build_seat(self, **payload: object) -> Seat:
        return Seat(**payload)
