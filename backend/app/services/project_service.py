from __future__ import annotations

from app.models.project import Project
from app.services.base_service import BaseService
from app.services.repositories.project_repository import ProjectRepository


class ProjectService(BaseService):
    def __init__(self, session) -> None:
        super().__init__(session)
        self.project_repository = ProjectRepository(session)

    def build_project(self, **payload: object) -> Project:
        return Project(**payload)
