from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.allocation import SeatAllocation
from app.models.employee import Employee
from app.models.project import Project
from app.models.seat import Seat


class DashboardService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def summary(self) -> dict[str, int]:
        return {
            "total_employees": int(self.session.scalar(select(func.count()).select_from(Employee)) or 0),
            "total_seats": int(self.session.scalar(select(func.count()).select_from(Seat)) or 0),
            "occupied_seats": int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Occupied")) or 0),
            "available_seats": int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Available")) or 0),
            "reserved_seats": int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Reserved")) or 0),
            "maintenance_seats": int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Maintenance")) or 0),
            "pending_allocations": int(
                self.session.scalar(select(func.count()).select_from(SeatAllocation).where(SeatAllocation.allocation_status == "pending")) or 0
            ),
        }

    def project_utilization(self):
        statement = (
            select(Project.id, Project.name, func.count(SeatAllocation.id))
            .join(SeatAllocation, SeatAllocation.project_id == Project.id, isouter=True)
            .group_by(Project.id)
            .order_by(Project.name.asc())
        )
        return self.session.execute(statement).all()

    def floor_utilization(self):
        statement = select(Seat.floor, func.count(Seat.id)).group_by(Seat.floor).order_by(Seat.floor.asc())
        return self.session.execute(statement).all()

    def zone_utilization(self):
        statement = select(Seat.zone, func.count(Seat.id)).group_by(Seat.zone).order_by(Seat.zone.asc())
        return self.session.execute(statement).all()
