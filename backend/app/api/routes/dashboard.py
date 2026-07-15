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
    return [{"name": project_name, "count": count} for _, project_name, count in rows]


@router.get("/floor-utilization")
def floor_utilization(db: Session = Depends(get_db)):
    service = DashboardService(db)
    rows = service.floor_utilization()
    return [{"name": floor, "count": int(count or 0)} for floor, count in rows]


@router.get("/zone-utilization")
def zone_utilization(db: Session = Depends(get_db)):
    service = DashboardService(db)
    rows = service.zone_utilization()
    return [{"name": zone, "count": int(count or 0)} for zone, count in rows]
