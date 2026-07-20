from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import EmployeeStatus
from app.schemas.project import ProjectRead


class EmployeeBase(BaseModel):
    employee_code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    department: str = Field(min_length=2, max_length=120)
    role: str = Field(min_length=2, max_length=120)
    joining_date: date
    employment_status: EmployeeStatus = EmployeeStatus.ACTIVE
    project_id: int


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    employee_code: str | None = None
    name: str | None = None
    email: EmailStr | None = None
    department: str | None = None
    role: str | None = None
    joining_date: date | None = None
    employment_status: EmployeeStatus | None = None
    project_id: int | None = None


class EmployeeRead(EmployeeBase):
    id: int
    project: ProjectRead
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
