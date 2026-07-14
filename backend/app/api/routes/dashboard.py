from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.allocation import SeatAllocation
from app.models.employee import Employee
from app.models.project import Project
from app.models.seat import Seat
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    service = DashboardService(db)
    return service.summary()


@router.get("/project-utilization")
def project_utilization(db: Session = Depends(get_db)):
    service = DashboardService(db)
    rows = service.project_utilization()
    return [{"project_id": project_id, "project": project_name, "allocations": count} for project_id, project_name, count in rows]


@router.get("/floor-utilization")
def floor_utilization(db: Session = Depends(get_db)):
    service = DashboardService(db)
    rows = service.floor_utilization()
    return [{"floor": floor, "seats": count} for floor, count in rows]


@router.get("/zone-utilization")
def zone_utilization(db: Session = Depends(get_db)):
    service = DashboardService(db)
    rows = service.zone_utilization()
    return [{"zone": zone, "seats": count} for zone, count in rows]
