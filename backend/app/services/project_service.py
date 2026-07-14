from __future__ import annotations

from fastapi import HTTPException, status

from app.models.project import Project
from app.services.base_service import BaseService
from app.services.repositories.employee_repository import EmployeeRepository
from app.services.repositories.project_repository import ProjectRepository


class ProjectService(BaseService):
    def __init__(self, session) -> None:
        super().__init__(session)
        self.project_repository = ProjectRepository(session)
        self.employee_repository = EmployeeRepository(session)

    def build_project(self, **payload: object) -> Project:
        name = str(payload.get("name", ""))
        if self.project_repository.get_by_name(name):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate project name")
        return Project(**payload)

    def update_project(self, project: Project, **payload: object) -> Project:
        new_name = payload.get("name")
        if new_name and new_name != project.name:
            existing = self.project_repository.get_by_name(str(new_name))
            if existing and existing.id != project.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate project name")
        for key, value in payload.items():
            if value is not None:
                setattr(project, key, value)
        return project

    def get_project(self, project_id: int) -> Project:
        project = self.project_repository.get_by_id(project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    def delete_project(self, project: Project) -> None:
        if self.project_repository.has_employees(project.id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project has assigned employees")
        self.project_repository.delete(project)

    def get_project_employees(self, project_id: int):
        return self.project_repository.get_employees(project_id)
