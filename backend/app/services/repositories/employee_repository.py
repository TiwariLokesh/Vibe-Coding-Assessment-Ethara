from __future__ import annotations

from collections.abc import Sequence
from datetime import date

from sqlalchemy import exists, func, or_, select

from app.models.allocation import SeatAllocation
from app.models.employee import Employee
from app.models.enums import AllocationStatus
from app.services.repositories.base_repository import BaseRepository


class EmployeeRepository(BaseRepository):
    def _apply_filters(
        self,
        statement,
        search_text: str | None = None,
        department: str | None = None,
        status: str | None = None,
        project_id: int | None = None,
        joining_date_from: date | None = None,
        joining_date_to: date | None = None,
        has_active_seat: bool | None = None,
    ):
        if search_text:
            pattern = f"%{search_text.strip()}%"
            statement = statement.where(
                or_(
                    Employee.name.ilike(pattern),
                    Employee.email.ilike(pattern),
                    Employee.employee_code.ilike(pattern),
                )
            )

        if department:
            statement = statement.where(
                Employee.department == department
            )

        if status:
            statement = statement.where(
                Employee.employment_status == status
            )

        if project_id is not None:
            statement = statement.where(
                Employee.project_id == project_id
            )

        if joining_date_from is not None:
            statement = statement.where(
                Employee.joining_date >= joining_date_from
            )

        if joining_date_to is not None:
            statement = statement.where(
                Employee.joining_date <= joining_date_to
            )

        active_allocation_exists = exists(
            select(SeatAllocation.id).where(
                SeatAllocation.employee_id == Employee.id,
                SeatAllocation.allocation_status
                == AllocationStatus.ACTIVE.value,
            )
        )

        if has_active_seat is True:
            statement = statement.where(
                active_allocation_exists
            )
        elif has_active_seat is False:
            statement = statement.where(
                ~active_allocation_exists
            )

        return statement

    def list(
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
        offset: int = 0,
        limit: int = 20,
    ) -> Sequence[Employee]:
        statement = select(Employee)

        statement = self._apply_filters(
            statement=statement,
            search_text=search_text,
            department=department,
            status=status,
            project_id=project_id,
            joining_date_from=joining_date_from,
            joining_date_to=joining_date_to,
            has_active_seat=has_active_seat,
        )

        sort_column = getattr(
            Employee,
            sort_by,
            Employee.name,
        )

        if sort_order.lower() == "desc":
            statement = statement.order_by(
                sort_column.desc()
            )
        else:
            statement = statement.order_by(
                sort_column.asc()
            )

        statement = statement.offset(offset).limit(limit)

        return self.session.scalars(statement).all()

    def count(
        self,
        search_text: str | None = None,
        department: str | None = None,
        status: str | None = None,
        project_id: int | None = None,
        joining_date_from: date | None = None,
        joining_date_to: date | None = None,
        has_active_seat: bool | None = None,
    ) -> int:
        statement = select(func.count(Employee.id))

        statement = self._apply_filters(
            statement=statement,
            search_text=search_text,
            department=department,
            status=status,
            project_id=project_id,
            joining_date_from=joining_date_from,
            joining_date_to=joining_date_to,
            has_active_seat=has_active_seat,
        )

        return int(
            self.session.scalar(statement) or 0
        )

    def get_by_id(
        self,
        employee_id: int,
    ) -> Employee | None:
        return self.session.get(
            Employee,
            employee_id,
        )

    def get_by_email(
        self,
        email: str,
    ) -> Employee | None:
        statement = select(Employee).where(
            Employee.email == email
        )

        return self.session.scalars(
            statement
        ).first()

    def get_by_employee_code(
        self,
        employee_code: str,
    ) -> Employee | None:
        statement = select(Employee).where(
            Employee.employee_code == employee_code
        )

        return self.session.scalars(
            statement
        ).first()

    def delete(
        self,
        employee: Employee,
    ) -> None:
        self.session.delete(employee)

    def has_active_seat(
        self,
        employee_id: int,
    ) -> bool:
        statement = select(
            exists().where(
                SeatAllocation.employee_id == employee_id,
                SeatAllocation.allocation_status
                == AllocationStatus.ACTIVE.value,
            )
        )

        return bool(
            self.session.scalar(statement)
        )