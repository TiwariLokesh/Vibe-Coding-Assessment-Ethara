from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status

from app.models.employee import Employee
from app.services.base_service import BaseService
from app.services.repositories.employee_repository import EmployeeRepository
from app.services.repositories.project_repository import ProjectRepository


class EmployeeService(BaseService):
    def __init__(self, session) -> None:
        super().__init__(session)
        self.employee_repository = EmployeeRepository(session)
        self.project_repository = ProjectRepository(session)

    def list_employees(
        self,
        search_text: str | None = None,
        department: str | None = None,
        status: str | None = None,
        project_id: int | None = None,
        joining_date_from: date | None = None,
        joining_date_to: date | None = None,
        has_active_seat: bool | None = None,
        sort_by: str = "name",
        sort_order: str = "asc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Employee], int, int]:
        offset = (page - 1) * page_size

        items = list(
            self.employee_repository.list(
                search_text=search_text,
                department=department,
                status=status,
                project_id=project_id,
                joining_date_from=joining_date_from,
                joining_date_to=joining_date_to,
                has_active_seat=has_active_seat,
                sort_by=sort_by,
                sort_order=sort_order,
                offset=offset,
                limit=page_size,
            )
        )

        total = self.employee_repository.count(
            search_text=search_text,
            department=department,
            status=status,
            project_id=project_id,
            joining_date_from=joining_date_from,
            joining_date_to=joining_date_to,
            has_active_seat=has_active_seat,
        )

        return items, total, page_size

    def build_employee(self, **payload: object) -> Employee:
        employee_code = str(
            payload.get("employee_code", "")
        )
        email = str(
            payload.get("email", "")
        )
        project_id = int(
            payload.get("project_id", 0)
        )

        if self.employee_repository.get_by_employee_code(
            employee_code
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate employee code",
            )

        if self.employee_repository.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate email",
            )

        if (
            self.project_repository.get_by_id(project_id)
            is None
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        return Employee(**payload)

    def update_employee(
        self,
        employee: Employee,
        **payload: object,
    ) -> Employee:
        new_code = payload.get("employee_code")
        new_email = payload.get("email")
        new_project_id = payload.get("project_id")

        if (
            new_code
            and new_code != employee.employee_code
        ):
            existing = (
                self.employee_repository
                .get_by_employee_code(str(new_code))
            )

            if (
                existing
                and existing.id != employee.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Duplicate employee code",
                )

        if (
            new_email
            and new_email != employee.email
        ):
            existing = (
                self.employee_repository
                .get_by_email(str(new_email))
            )

            if (
                existing
                and existing.id != employee.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Duplicate email",
                )

        if (
            new_project_id is not None
            and self.project_repository.get_by_id(
                int(new_project_id)
            )
            is None
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        for key, value in payload.items():
            if value is not None:
                setattr(employee, key, value)

        return employee

    def get_employee(
        self,
        employee_id: int,
    ) -> Employee:
        employee = self.employee_repository.get_by_id(
            employee_id
        )

        if employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found",
            )

        return employee

    def delete_employee(
        self,
        employee: Employee,
    ) -> None:
        self.employee_repository.delete(employee)