from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import SeatStatus

if TYPE_CHECKING:
    from app.models.allocation import SeatAllocation
    from app.models.employee import Employee


class Seat(Base):
    __tablename__ = "seats"
    __table_args__ = (
        UniqueConstraint("floor", "zone", "seat_number", name="uq_seat_floor_zone_seat_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    floor: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    zone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    bay: Mapped[str] = mapped_column(String(20), nullable=False)
    seat_number: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=SeatStatus.AVAILABLE.value, nullable=False)
    active_employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id"),
        unique=True,
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    active_employee: Mapped["Employee | None"] = relationship(
        back_populates="active_seat",
        foreign_keys=[active_employee_id],
    )
    allocations: Mapped[list["SeatAllocation"]] = relationship(back_populates="seat")
