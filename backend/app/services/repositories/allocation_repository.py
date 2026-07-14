from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import and_, select

from app.models.allocation import SeatAllocation
from app.services.repositories.base_repository import BaseRepository


class AllocationRepository(BaseRepository):
    def list(self) -> Sequence[SeatAllocation]:
        statement = select(SeatAllocation).order_by(SeatAllocation.allocation_date.desc())
        return self.session.scalars(statement).all()

    def get_active_allocation_for_employee(self, employee_id: int) -> SeatAllocation | None:
        statement = select(SeatAllocation).where(
            and_(
                SeatAllocation.employee_id == employee_id,
                SeatAllocation.allocation_status == "active",
            )
        )
        return self.session.scalars(statement).first()

    def get_active_allocation_for_seat(self, seat_id: int) -> SeatAllocation | None:
        statement = select(SeatAllocation).where(
            and_(SeatAllocation.seat_id == seat_id, SeatAllocation.allocation_status == "active")
        )
        return self.session.scalars(statement).first()
