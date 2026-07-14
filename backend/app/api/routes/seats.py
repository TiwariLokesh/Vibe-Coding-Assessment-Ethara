from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.common import APIResponse, MessageResponse
from app.schemas.seat import SeatCreate, SeatRead, SeatUpdate
from app.services.seat_service import SeatService

router = APIRouter(prefix="/seats", tags=["Seats"])


@router.post("", response_model=APIResponse[SeatRead], status_code=status.HTTP_201_CREATED)
def create_seat(payload: SeatCreate, db: Session = Depends(get_db)):
    service = SeatService(db)
    try:
        seat = service.build_seat(**payload.model_dump())
        db.add(seat)
        db.commit()
        db.refresh(seat)
        return APIResponse(message="Seat created", data=seat)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.get("", response_model=APIResponse[list[SeatRead]])
def list_seats(
    floor: str | None = Query(default=None),
    zone: str | None = Query(default=None),
    bay: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    service = SeatService(db)
    seats = service.seat_repository.list(floor=floor, zone=zone, bay=bay, status=status_filter)
    return APIResponse(message="Seats retrieved", data=list(seats))


@router.get("/available", response_model=APIResponse[list[SeatRead]])
def list_available_seats(zone: str | None = Query(default=None), db: Session = Depends(get_db)):
    service = SeatService(db)
    seats = service.seat_repository.available_in_zone(zone=zone)
    return APIResponse(message="Available seats retrieved", data=list(seats))


@router.get("/{seat_id}", response_model=APIResponse[SeatRead])
def get_seat(seat_id: int, db: Session = Depends(get_db)):
    service = SeatService(db)
    seat = service.get_seat(seat_id)
    return APIResponse(message="Seat retrieved", data=seat)


@router.put("/{seat_id}", response_model=APIResponse[SeatRead])
def update_seat(seat_id: int, payload: SeatUpdate, db: Session = Depends(get_db)):
    service = SeatService(db)
    try:
        seat = service.get_seat(seat_id)
        updated_seat = service.update_seat(seat, **payload.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(updated_seat)
        return APIResponse(message="Seat updated", data=updated_seat)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.delete("/{seat_id}", response_model=MessageResponse)
def delete_seat(seat_id: int, db: Session = Depends(get_db)):
    service = SeatService(db)
    try:
        seat = service.get_seat(seat_id)
        service.delete_seat(seat)
        db.commit()
        return MessageResponse(message="Seat deleted")
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
