from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

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
