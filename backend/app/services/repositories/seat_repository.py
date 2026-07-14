from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import and_, select

from app.models.seat import Seat
from app.services.repositories.base_repository import BaseRepository


class SeatRepository(BaseRepository):
    def list(self, floor: str | None = None, zone: str | None = None, status: str | None = None) -> Sequence[Seat]:
        statement = select(Seat).order_by(Seat.floor.asc(), Seat.zone.asc(), Seat.seat_number.asc())
        conditions = []
        if floor:
            conditions.append(Seat.floor == floor)
        if zone:
            conditions.append(Seat.zone == zone)
        if status:
            conditions.append(Seat.status == status)
        if conditions:
            statement = statement.where(and_(*conditions))
        return self.session.scalars(statement).all()

    def get_by_id(self, seat_id: int) -> Seat | None:
        return self.session.get(Seat, seat_id)

    def get_by_identity(self, floor: str, zone: str, seat_number: str) -> Seat | None:
        statement = select(Seat).where(
            Seat.floor == floor,
            Seat.zone == zone,
            Seat.seat_number == seat_number,
        )
        return self.session.scalars(statement).first()

    def available_in_zone(self, zone: str | None = None) -> Sequence[Seat]:
        statement = select(Seat).where(Seat.status == "Available", Seat.active_employee_id.is_(None))
        if zone:
            statement = statement.where(Seat.zone == zone)
        return self.session.scalars(statement.order_by(Seat.floor.asc(), Seat.zone.asc(), Seat.seat_number.asc())).all()
