from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.employee import Employee
from app.models.project import Project
from app.models.seat import Seat

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
def universal_search(q: str = Query(min_length=1), db: Session = Depends(get_db)):
    pattern = f"%{q.strip()}%"
    employees = db.execute(
        select(Employee).where(
            or_(Employee.name.ilike(pattern), Employee.employee_code.ilike(pattern), Employee.email.ilike(pattern))
        )
    ).scalars().all()
    projects = db.execute(select(Project).where(Project.name.ilike(pattern))).scalars().all()
    seats = db.execute(
        select(Seat).where(or_(Seat.floor.ilike(pattern), Seat.zone.ilike(pattern), Seat.seat_number.ilike(pattern)))
    ).scalars().all()
    return {"employees": employees, "projects": projects, "seats": seats}
