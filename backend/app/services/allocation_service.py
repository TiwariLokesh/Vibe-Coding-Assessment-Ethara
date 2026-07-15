from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.models.allocation import SeatAllocation
from app.models.enums import AllocationStatus, SeatStatus
from app.services.base_service import BaseService
from app.services.repositories.allocation_repository import AllocationRepository
from app.services.repositories.employee_repository import EmployeeRepository
from app.services.repositories.project_repository import ProjectRepository
from app.services.repositories.seat_repository import SeatRepository


class AllocationService(BaseService):
    def __init__(self, session) -> None:
        super().__init__(session)
        self.allocation_repository = AllocationRepository(session)
        self.employee_repository = EmployeeRepository(session)
        self.project_repository = ProjectRepository(session)
        self.seat_repository = SeatRepository(session)

    def validate_allocation_rules(
        self,
        employee_id: int,
        seat_id: int,
        project_id: int,
    ) -> None:
        employee = self.employee_repository.get_by_id(employee_id)

        if employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found",
            )

        if employee.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee project mismatch",
            )

        active_allocation = (
            self.allocation_repository
            .get_active_allocation_for_employee(employee_id)
        )

        if active_allocation is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee already has an active seat",
            )

        seat = self.seat_repository.get_by_id(seat_id)

        if seat is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seat not found",
            )

        if seat.status == SeatStatus.RESERVED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Reserved seats cannot be allocated",
            )

        if seat.status == SeatStatus.MAINTENANCE.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seats under maintenance cannot be allocated",
            )

        if seat.active_employee_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seat already belongs to an employee",
            )

        active_seat_allocation = (
            self.allocation_repository
            .get_active_allocation_for_seat(seat_id)
        )

        if active_seat_allocation is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seat already has an active allocation",
            )

    def allocate(
        self,
        employee_id: int,
        seat_id: int,
        project_id: int,
    ) -> SeatAllocation:
        self.validate_allocation_rules(
            employee_id=employee_id,
            seat_id=seat_id,
            project_id=project_id,
        )

        pending_allocations = (
            self.session.query(SeatAllocation)
            .filter(
                SeatAllocation.employee_id == employee_id,
                SeatAllocation.allocation_status
                == AllocationStatus.PENDING.value,
            )
            .all()
        )

        for pending_allocation in pending_allocations:
            pending_allocation.allocation_status = (
                AllocationStatus.CANCELLED.value
            )
            pending_allocation.released_date = datetime.now(timezone.utc)

        allocation = SeatAllocation(
            employee_id=employee_id,
            seat_id=seat_id,
            project_id=project_id,
            allocation_status=AllocationStatus.ACTIVE.value,
        )

        seat = self.seat_repository.get_by_id(seat_id)

        seat.active_employee_id = employee_id
        seat.status = SeatStatus.OCCUPIED.value

        self.session.add(allocation)
        self.session.commit()
        self.session.refresh(allocation)

        return allocation

    def release(
        self,
        seat_id: int,
    ) -> SeatAllocation:
        seat = self.seat_repository.get_by_id(seat_id)

        if seat is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seat not found",
            )

        allocation = (
            self.allocation_repository
            .get_active_allocation_for_seat(seat_id)
        )

        if allocation is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Active allocation not found",
            )

        allocation.allocation_status = (
            AllocationStatus.RELEASED.value
        )
        allocation.released_date = datetime.now(timezone.utc)

        seat.active_employee_id = None
        seat.status = SeatStatus.AVAILABLE.value

        self.session.commit()
        self.session.refresh(allocation)

        return allocation