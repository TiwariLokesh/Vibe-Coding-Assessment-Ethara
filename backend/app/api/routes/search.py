from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.employee import Employee
from app.models.project import Project
from app.models.seat import Seat
from app.models.allocation import SeatAllocation

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
def universal_search(q: str = Query(min_length=1), db: Session = Depends(get_db)):
    pattern = f"%{q.strip()}%"
    
    # Search Employees (by name, code, email, or their assigned project name)
    employees = db.execute(
        select(Employee)
        .join(Project, Employee.project_id == Project.id)
        .where(
            or_(
                Employee.name.ilike(pattern),
                Employee.employee_code.ilike(pattern),
                Employee.email.ilike(pattern),
                Project.name.ilike(pattern)
            )
        )
    ).scalars().all()
    
    # Search Projects (by name, description, or manager name)
    projects = db.execute(
        select(Project).where(
            or_(
                Project.name.ilike(pattern),
                Project.manager_name.ilike(pattern)
            )
        )
    ).scalars().all()
    
    # Search Seats (by floor, zone, bay, or seat number)
    seats = db.execute(
        select(Seat).where(
            or_(
                Seat.floor.ilike(pattern),
                Seat.zone.ilike(pattern),
                Seat.bay.ilike(pattern),
                Seat.seat_number.ilike(pattern)
            )
        )
    ).scalars().all()
    
    # Search SeatAllocations (by employee name/code/email, seat number, floor, zone, or project name)
    allocations_db = db.execute(
        select(SeatAllocation)
        .join(Employee, SeatAllocation.employee_id == Employee.id)
        .join(Seat, SeatAllocation.seat_id == Seat.id)
        .join(Project, SeatAllocation.project_id == Project.id)
        .where(
            or_(
                Employee.name.ilike(pattern),
                Employee.employee_code.ilike(pattern),
                Employee.email.ilike(pattern),
                Seat.seat_number.ilike(pattern),
                Seat.floor.ilike(pattern),
                Seat.zone.ilike(pattern),
                Project.name.ilike(pattern)
            )
        )
    ).scalars().all()
    
    # Format allocations for easy frontend consumption
    allocations = []
    for alloc in allocations_db:
        allocations.append({
            "id": alloc.id,
            "employee_id": alloc.employee_id,
            "employee_name": alloc.employee.name,
            "employee_code": alloc.employee.employee_code,
            "seat_id": alloc.seat_id,
            "seat_number": alloc.seat.seat_number,
            "floor": alloc.seat.floor,
            "zone": alloc.seat.zone,
            "project_name": alloc.project.name,
            "status": alloc.allocation_status,
            "employee": {
                "name": alloc.employee.name,
                "employee_code": alloc.employee.employee_code
            },
            "seat": {
                "seat_number": alloc.seat.seat_number,
                "floor": alloc.seat.floor,
                "zone": alloc.seat.zone
            }
        })
        
    return {
        "employees": employees,
        "projects": projects,
        "seats": seats,
        "allocations": allocations
    }
