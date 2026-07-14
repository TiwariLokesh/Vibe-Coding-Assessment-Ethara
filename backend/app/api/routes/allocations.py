from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.allocation import SeatAllocationRead
from app.schemas.common import APIResponse
from app.services.allocation_service import AllocationService

router = APIRouter(prefix="/seats", tags=["Seat Allocation"])


class AllocationRequest(BaseModel):
    employee_id: int
    seat_id: int
    project_id: int


class ReleaseRequest(BaseModel):
    seat_id: int


@router.post("/allocate", response_model=APIResponse[SeatAllocationRead], status_code=status.HTTP_201_CREATED)
def allocate_seat(payload: AllocationRequest, db: Session = Depends(get_db)):
    service = AllocationService(db)
    try:
        allocation = service.allocate(payload.employee_id, payload.seat_id, payload.project_id)
        return APIResponse(message="Seat allocated", data=allocation)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/release", response_model=APIResponse[SeatAllocationRead])
def release_seat(payload: ReleaseRequest, db: Session = Depends(get_db)):
    service = AllocationService(db)
    try:
        allocation = service.release(payload.seat_id)
        return APIResponse(message="Seat released", data=allocation)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
