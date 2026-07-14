from __future__ import annotations

from fastapi import HTTPException, status

from app.models.seat import Seat
from app.services.base_service import BaseService
from app.services.repositories.seat_repository import SeatRepository


class SeatService(BaseService):
    def __init__(self, session) -> None:
        super().__init__(session)
        self.seat_repository = SeatRepository(session)

    def build_seat(self, **payload: object) -> Seat:
        floor = str(payload.get("floor", ""))
        zone = str(payload.get("zone", ""))
        seat_number = str(payload.get("seat_number", ""))
        if self.seat_repository.get_by_identity(floor, zone, seat_number):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate seat number on this floor and zone")
        return Seat(**payload)

    def update_seat(self, seat: Seat, **payload: object) -> Seat:
        new_floor = payload.get("floor")
        new_zone = payload.get("zone")
        new_seat_number = payload.get("seat_number")
        if new_floor or new_zone or new_seat_number:
            floor = str(new_floor or seat.floor)
            zone = str(new_zone or seat.zone)
            seat_number = str(new_seat_number or seat.seat_number)
            existing = self.seat_repository.get_by_identity(floor, zone, seat_number)
            if existing and existing.id != seat.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate seat number on this floor and zone")
        for key, value in payload.items():
            if value is not None:
                setattr(seat, key, value)
        return seat

    def get_seat(self, seat_id: int) -> Seat:
        seat = self.seat_repository.get_by_id(seat_id)
        if seat is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")
        return seat

    def delete_seat(self, seat: Seat) -> None:
        if seat.active_employee_id is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Allocated seats cannot be deleted")
        self.seat_repository.delete(seat)
