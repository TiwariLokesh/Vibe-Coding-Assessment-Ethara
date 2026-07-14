from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.common import APIResponse, MessageResponse
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=APIResponse[ProjectRead], status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    service = ProjectService(db)
    try:
        project = service.build_project(**payload.model_dump())
        db.add(project)
        db.commit()
        db.refresh(project)
        return APIResponse(message="Project created", data=project)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.get("", response_model=APIResponse[list[ProjectRead]])
def list_projects(db: Session = Depends(get_db)):
    service = ProjectService(db)
    projects = service.project_repository.list()
    return APIResponse(message="Projects retrieved", data=list(projects))


@router.get("/{project_id}", response_model=APIResponse[ProjectRead])
def get_project(project_id: int, db: Session = Depends(get_db)):
    service = ProjectService(db)
    project = service.get_project(project_id)
    return APIResponse(message="Project retrieved", data=project)


@router.put("/{project_id}", response_model=APIResponse[ProjectRead])
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    service = ProjectService(db)
    try:
        project = service.get_project(project_id)
        updated_project = service.update_project(project, **payload.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(updated_project)
        return APIResponse(message="Project updated", data=updated_project)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.delete("/{project_id}", response_model=MessageResponse)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    service = ProjectService(db)
    try:
        project = service.get_project(project_id)
        service.delete_project(project)
        db.commit()
        return MessageResponse(message="Project deleted")
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.get("/{project_id}/employees", response_model=APIResponse[list])
def get_project_employees(project_id: int, db: Session = Depends(get_db)):
    service = ProjectService(db)
    employees = service.get_project_employees(project_id)
    return APIResponse(message="Project employees retrieved", data=list(employees))
