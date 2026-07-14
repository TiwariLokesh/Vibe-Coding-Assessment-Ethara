from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select

from app.models.project import Project
from app.services.repositories.base_repository import BaseRepository


class ProjectRepository(BaseRepository):
    def list(self) -> Sequence[Project]:
        statement = select(Project).order_by(Project.name.asc())
        return self.session.scalars(statement).all()

    def get_by_id(self, project_id: int) -> Project | None:
        return self.session.get(Project, project_id)

    def get_by_name(self, name: str) -> Project | None:
        statement = select(Project).where(Project.name == name)
        return self.session.scalars(statement).first()

    def delete(self, project: Project) -> None:
        self.session.delete(project)

    def get_employees(self, project_id: int):
        from app.models.employee import Employee

        statement = select(Employee).where(Employee.project_id == project_id).order_by(Employee.name.asc())
        return self.session.scalars(statement).all()

    def has_employees(self, project_id: int) -> bool:
        from app.models.employee import Employee

        statement = select(Employee.id).where(Employee.project_id == project_id)
        return self.session.scalar(statement) is not None
