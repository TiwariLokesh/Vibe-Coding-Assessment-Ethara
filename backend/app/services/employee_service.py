from __future__ import annotations

from app.models.employee import Employee
from app.services.base_service import BaseService
from app.services.repositories.employee_repository import EmployeeRepository
from app.services.repositories.project_repository import ProjectRepository


class EmployeeService(BaseService):
    def __init__(self, session) -> None:
        super().__init__(session)
        self.employee_repository = EmployeeRepository(session)
        self.project_repository = ProjectRepository(session)

    def ensure_unique_employee(self, employee_code: str, email: str) -> None:
        self._ = self.employee_repository.get_by_employee_code(employee_code)
        self._ = self.employee_repository.get_by_email(email)

    def build_employee(self, **payload: object) -> Employee:
        return Employee(**payload)
