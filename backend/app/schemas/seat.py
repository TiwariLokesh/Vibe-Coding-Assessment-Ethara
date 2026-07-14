from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SeatStatus


class SeatBase(BaseModel):
    floor: str = Field(min_length=1, max_length=20)
    zone: str = Field(min_length=1, max_length=20)
    bay: str = Field(min_length=1, max_length=20)
    seat_number: str = Field(min_length=1, max_length=40)
    status: SeatStatus = SeatStatus.AVAILABLE
    active_employee_id: int | None = None


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    floor: str | None = None
    zone: str | None = None
    bay: str | None = None
    seat_number: str | None = None
    status: SeatStatus | None = None
    active_employee_id: int | None = None


class SeatRead(SeatBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
