from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AllocationStatus


class SeatAllocationBase(BaseModel):
    employee_id: int
    seat_id: int
    project_id: int
    allocation_status: AllocationStatus = AllocationStatus.ACTIVE


class SeatAllocationCreate(SeatAllocationBase):
    pass


class SeatAllocationUpdate(BaseModel):
    allocation_status: AllocationStatus | None = None
    released_date: datetime | None = None


class SeatAllocationRead(SeatAllocationBase):
    id: int
    allocation_date: datetime
    released_date: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
