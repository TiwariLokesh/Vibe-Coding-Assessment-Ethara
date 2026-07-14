from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.common import APIResponse, MessageResponse
from app.schemas.employee import EmployeeCreate, EmployeeRead, EmployeeUpdate
from app.schemas.pagination import PaginationMeta
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post("", response_model=APIResponse[EmployeeRead], status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    service = EmployeeService(db)
    try:
        employee = service.build_employee(**payload.model_dump())
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return APIResponse(message="Employee created", data=employee)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.get("", response_model=APIResponse[list[EmployeeRead]])
def list_employees(
    search: str | None = Query(default=None),
    department: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    project_id: int | None = Query(default=None),
    joining_date_from: date | None = Query(default=None),
    joining_date_to: date | None = Query(default=None),
    sort_by: str = Query(default="name"),
    sort_order: str = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)
    employees, total, page_size_value = service.list_employees(
        search_text=search,
        department=department,
        status=status_filter,
        project_id=project_id,
        joining_date_from=joining_date_from,
        joining_date_to=joining_date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    pagination = PaginationMeta(
        page=page,
        page_size=page_size_value,
        total=total,
        pages=max((total + page_size_value - 1) // page_size_value, 1),
    )
    return {
        "success": True,
        "message": "Employees retrieved",
        "data": employees,
        "pagination": pagination.model_dump(),
    }


@router.get("/{employee_id}", response_model=APIResponse[EmployeeRead])
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    service = EmployeeService(db)
    employee = service.get_employee(employee_id)
    return APIResponse(message="Employee retrieved", data=employee)


@router.put("/{employee_id}", response_model=APIResponse[EmployeeRead])
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    service = EmployeeService(db)
    try:
        employee = service.get_employee(employee_id)
        updated_employee = service.update_employee(employee, **payload.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(updated_employee)
        return APIResponse(message="Employee updated", data=updated_employee)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.delete("/{employee_id}", response_model=MessageResponse)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    service = EmployeeService(db)
    try:
        employee = service.get_employee(employee_id)
        service.delete_employee(employee)
        db.commit()
        return MessageResponse(message="Employee deleted")
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
