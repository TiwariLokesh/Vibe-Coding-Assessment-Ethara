from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import or_, select

from app.models.employee import Employee
from app.services.repositories.base_repository import BaseRepository


class EmployeeRepository(BaseRepository):
    def list(self, search_text: str | None = None) -> Sequence[Employee]:
        statement = select(Employee).order_by(Employee.name.asc())
        if search_text:
            pattern = f"%{search_text.strip()}%"
            statement = statement.where(
                or_(
                    Employee.name.ilike(pattern),
                    Employee.email.ilike(pattern),
                    Employee.employee_code.ilike(pattern),
                )
            )
        return self.session.scalars(statement).all()

    def get_by_id(self, employee_id: int) -> Employee | None:
        return self.session.get(Employee, employee_id)

    def get_by_email(self, email: str) -> Employee | None:
        statement = select(Employee).where(Employee.email == email)
        return self.session.scalars(statement).first()

    def get_by_employee_code(self, employee_code: str) -> Employee | None:
        statement = select(Employee).where(Employee.employee_code == employee_code)
        return self.session.scalars(statement).first()
