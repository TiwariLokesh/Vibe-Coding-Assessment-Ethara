from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.allocation import SeatAllocation
from app.models.enums import AllocationStatus
from app.schemas.allocation import SeatAllocationRead
from app.schemas.common import APIResponse
from app.services.allocation_service import AllocationService

router = APIRouter(prefix="/seats", tags=["Seat Allocation"])


class AllocationRequest(BaseModel):
    employee_id: int
    seat_id: int
    project_id: int


class ReleaseRequest(BaseModel):
    employee_id: int


@router.post(
    "/allocate",
    response_model=APIResponse[SeatAllocationRead],
    status_code=status.HTTP_201_CREATED,
)
def allocate_seat(
    payload: AllocationRequest,
    db: Session = Depends(get_db),
):
    service = AllocationService(db)

    try:
        allocation = service.allocate(
            payload.employee_id,
            payload.seat_id,
            payload.project_id,
        )

        return APIResponse(
            message="Seat allocated",
            data=allocation,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.post(
    "/release",
    response_model=APIResponse[SeatAllocationRead],
)
def release_seat(
    payload: ReleaseRequest,
    db: Session = Depends(get_db),
):
    service = AllocationService(db)

    try:
        statement = (
            select(SeatAllocation)
            .where(
                SeatAllocation.employee_id == payload.employee_id,
                SeatAllocation.allocation_status
                == AllocationStatus.ACTIVE.value,
            )
            .order_by(SeatAllocation.id.desc())
        )

        active_allocation = db.scalars(statement).first()

        if active_allocation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee does not have an active seat",
            )

        allocation = service.release(
            active_allocation.seat_id
        )

        return APIResponse(
            message="Seat released",
            data=allocation,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise