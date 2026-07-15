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

    def summary(self) -> dict[str, Any]:
        total_employees = int(self.session.scalar(select(func.count()).select_from(Employee)) or 0)
        total_seats = int(self.session.scalar(select(func.count()).select_from(Seat)) or 0)
        occupied_seats = int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Occupied")) or 0)
        available_seats = int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Available")) or 0)
        reserved_seats = int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Reserved")) or 0)
        maintenance_seats = int(self.session.scalar(select(func.count()).select_from(Seat).where(Seat.status == "Maintenance")) or 0)
        pending_allocations = int(
            self.session.scalar(select(func.count()).select_from(SeatAllocation).where(SeatAllocation.allocation_status == "pending")) or 0
        )
        total_projects = int(self.session.scalar(select(func.count()).select_from(Project)) or 0)
        total_allocations = int(self.session.scalar(select(func.count()).select_from(SeatAllocation)) or 0)
        
        utilization_rate = round((occupied_seats / total_seats * 100), 1) if total_seats > 0 else 0.0

        return {
            # snake_case for compatibility
            "total_employees": total_employees,
            "total_seats": total_seats,
            "occupied_seats": occupied_seats,
            "available_seats": available_seats,
            "reserved_seats": reserved_seats,
            "maintenance_seats": maintenance_seats,
            "pending_allocations": pending_allocations,
            # camelCase for frontend binding
            "totalEmployees": total_employees,
            "allocatedEmployees": occupied_seats,  # Allocated employees match occupied seats
            "availableSeats": available_seats,
            "totalProjects": total_projects,
            "utilizationRate": utilization_rate,
            "totalAllocations": total_allocations,
        }

    def project_utilization(self):
        # Count active allocations per project
        statement = (
            select(Project.id, Project.name, func.count(SeatAllocation.id))
            .join(SeatAllocation, (SeatAllocation.project_id == Project.id) & (SeatAllocation.allocation_status == "active"), isouter=True)
            .group_by(Project.id)
            .order_by(Project.name.asc())
        )
        return self.session.execute(statement).all()

    def floor_utilization(self):
        # Count occupied seats per floor
        from sqlalchemy import case
        statement = (
            select(Seat.floor, func.sum(case((Seat.status == "Occupied", 1), else_=0)))
            .group_by(Seat.floor)
            .order_by(Seat.floor.asc())
        )
        return self.session.execute(statement).all()

    def zone_utilization(self):
        # Count occupied seats per zone
        from sqlalchemy import case
        statement = (
            select(Seat.zone, func.sum(case((Seat.status == "Occupied", 1), else_=0)))
            .group_by(Seat.zone)
            .order_by(Seat.zone.asc())
        )
        return self.session.execute(statement).all()
