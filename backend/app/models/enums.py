from __future__ import annotations

from enum import Enum


class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    NOTICE = "notice"
    TERMINATED = "terminated"


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class SeatStatus(str, Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    RESERVED = "Reserved"
    MAINTENANCE = "Maintenance"


class AllocationStatus(str, Enum):
    ACTIVE = "active"
    RELEASED = "released"
    PENDING = "pending"
    CANCELLED = "cancelled"
