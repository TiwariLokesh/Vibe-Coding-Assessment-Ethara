from __future__ import annotations

import csv
import io
from datetime import date, datetime

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.common import APIResponse, MessageResponse
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
)
from app.schemas.pagination import PaginationMeta
from app.services.employee_service import EmployeeService

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)

@router.get("/search/active-seat", response_model=APIResponse[list[EmployeeRead]])
def search_employees_with_active_seat(
    search: str = Query(min_length=1),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)

    employees, _, _ = service.list_employees(
        search_text=search.strip(),
        status="active",
        has_active_seat=True,
        sort_by="name",
        sort_order="asc",
        page=1,
        page_size=limit,
    )

    normalized_search = search.strip().lower()

    employees = sorted(
        employees,
        key=lambda employee: (
            0
            if employee.employee_code.lower() == normalized_search
            else 1
            if employee.name.lower() == normalized_search
            else 2
            if employee.employee_code.lower().startswith(normalized_search)
            else 3
            if employee.name.lower().startswith(normalized_search)
            else 4,
            employee.name.lower(),
        ),
    )

    return APIResponse(
        message="Employees with active seats retrieved",
        data=employees,
    )

@router.post(
    "",
    response_model=APIResponse[EmployeeRead],
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)

    try:
        employee = service.build_employee(
            **payload.model_dump()
        )

        db.add(employee)
        db.commit()
        db.refresh(employee)

        return APIResponse(
            message="Employee created",
            data=employee,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.get(
    "",
    response_model=APIResponse[list[EmployeeRead]],
)
def list_employees(
    search: str | None = Query(default=None),
    department: str | None = Query(default=None),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    project_id: int | None = Query(default=None),
    joining_date_from: date | None = Query(default=None),
    joining_date_to: date | None = Query(default=None),
    has_active_seat: bool | None = Query(default=None),
    sort_by: str = Query(default="name"),
    sort_order: str = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)

    employees, total, page_size_value = (
        service.list_employees(
            search_text=search,
            department=department,
            status=status_filter,
            project_id=project_id,
            joining_date_from=joining_date_from,
            joining_date_to=joining_date_to,
            has_active_seat=has_active_seat,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )
    )

    pagination = PaginationMeta(
        page=page,
        page_size=page_size_value,
        total=total,
        pages=max(
            (
                total
                + page_size_value
                - 1
            )
            // page_size_value,
            1,
        ),
    )

    return {
        "success": True,
        "message": "Employees retrieved",
        "data": employees,
        "pagination": pagination.model_dump(),
    }


@router.get(
    "/{employee_id}",
    response_model=APIResponse[EmployeeRead],
)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)

    employee = service.get_employee(employee_id)

    return APIResponse(
        message="Employee retrieved",
        data=employee,
    )


@router.put(
    "/{employee_id}",
    response_model=APIResponse[EmployeeRead],
)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)

    try:
        employee = service.get_employee(
            employee_id
        )

        updated_employee = service.update_employee(
            employee,
            **payload.model_dump(
                exclude_unset=True
            ),
        )

        db.commit()
        db.refresh(updated_employee)

        return APIResponse(
            message="Employee updated",
            data=updated_employee,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.delete(
    "/{employee_id}",
    response_model=MessageResponse,
)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
):
    service = EmployeeService(db)

    try:
        employee = service.get_employee(
            employee_id
        )

        service.delete_employee(employee)

        db.commit()

        return MessageResponse(
            message="Employee deleted"
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.post(
    "/upload-csv",
    response_model=APIResponse[dict],
)
def upload_employees_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    filename = file.filename or ""

    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed.",
        )

    try:
        contents = file.file.read()
        decoded_contents = contents.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="CSV file must use UTF-8 encoding.",
        ) from exc

    buffer = io.StringIO(decoded_contents)
    reader = csv.DictReader(buffer)

    if not reader.fieldnames:
        raise HTTPException(
            status_code=400,
            detail="Empty CSV file.",
        )

    headers = [
        header.strip().lower().replace(" ", "_")
        for header in reader.fieldnames
    ]

    reader.fieldnames = headers

    required_headers = {
        "employee_code",
        "name",
        "email",
        "joining_date",
    }

    missing = required_headers - set(headers)

    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing required columns in CSV: "
                + ", ".join(sorted(missing))
            ),
        )

    service = EmployeeService(db)

    errors: list[str] = []
    employees_to_create = []

    seen_codes: set[str] = set()
    seen_emails: set[str] = set()

    from app.models.employee import Employee
    from app.models.project import Project

    for row_idx, row in enumerate(
        reader,
        start=2,
    ):
        code = (
            row.get("employee_code") or ""
        ).strip()

        name = (
            row.get("name") or ""
        ).strip()

        email = (
            row.get("email") or ""
        ).strip().lower()

        department = (
            row.get("department")
            or "Operations"
        ).strip()

        role = (
            row.get("role")
            or "Associate"
        ).strip()

        joining_date_str = (
            row.get("joining_date") or ""
        ).strip()

        employment_status = (
            row.get("employment_status")
            or "active"
        ).strip().lower()

        project_identifier = (
            row.get("project_name")
            or row.get("project_id")
            or ""
        ).strip()

        if not code:
            errors.append(
                f"Row {row_idx}: "
                "employee_code is required."
            )
            continue

        if not name:
            errors.append(
                f"Row {row_idx}: "
                "name is required."
            )
            continue

        if not email:
            errors.append(
                f"Row {row_idx}: "
                "email is required."
            )
            continue

        if not joining_date_str:
            errors.append(
                f"Row {row_idx}: "
                "joining_date is required."
            )
            continue

        try:
            joining_date = datetime.strptime(
                joining_date_str,
                "%Y-%m-%d",
            ).date()

        except ValueError:
            errors.append(
                f"Row {row_idx}: joining_date must "
                "be in YYYY-MM-DD format "
                f"(got '{joining_date_str}')."
            )
            continue

        if "@" not in email:
            errors.append(
                f"Row {row_idx}: "
                f"Email '{email}' is invalid."
            )
            continue

        if code in seen_codes:
            errors.append(
                f"Row {row_idx}: Duplicate "
                f"employee_code '{code}' in the CSV."
            )
            continue

        if email in seen_emails:
            errors.append(
                f"Row {row_idx}: Duplicate "
                f"email '{email}' in the CSV."
            )
            continue

        if service.employee_repository.get_by_employee_code(
            code
        ):
            errors.append(
                f"Row {row_idx}: employee_code "
                f"'{code}' already exists in database."
            )
            continue

        if service.employee_repository.get_by_email(
            email
        ):
            errors.append(
                f"Row {row_idx}: email "
                f"'{email}' already exists in database."
            )
            continue

        if not project_identifier:
            errors.append(
                f"Row {row_idx}: "
                "Project name or ID is required."
            )
            continue

        project = None

        if project_identifier.isdigit():
            project = (
                db.query(Project)
                .filter(
                    Project.id
                    == int(project_identifier)
                )
                .first()
            )

        if project is None:
            project = (
                db.query(Project)
                .filter(
                    Project.name.ilike(
                        project_identifier
                    )
                )
                .first()
            )

        if project is None:
            errors.append(
                f"Row {row_idx}: Project "
                f"'{project_identifier}' "
                "not found in database."
            )
            continue

        seen_codes.add(code)
        seen_emails.add(email)

        employees_to_create.append(
            Employee(
                employee_code=code,
                name=name,
                email=email,
                department=department,
                role=role,
                joining_date=joining_date,
                employment_status=employment_status,
                project_id=project.id,
            )
        )

    if errors:
        return APIResponse(
            success=False,
            message="CSV validation failed",
            data={
                "errors": errors,
                "inserted": 0,
            },
        )

    try:
        db.add_all(employees_to_create)
        db.commit()

        return APIResponse(
            success=True,
            message=(
                "Successfully imported "
                f"{len(employees_to_create)} "
                "employees."
            ),
            data={
                "inserted": len(
                    employees_to_create
                )
            },
        )

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Database error during import: "
                f"{str(exc)}"
            ),
        ) from exc


        