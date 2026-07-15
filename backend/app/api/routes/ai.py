from __future__ import annotations

import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.employee import Employee
from app.models.seat import Seat
from app.models.project import Project
from app.models.allocation import SeatAllocation
from app.models.enums import SeatStatus, AllocationStatus
from app.services.allocation_service import AllocationService
from app.schemas.common import APIResponse

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class AIQueryRequest(BaseModel):
    query: str


class AIQueryResponse(BaseModel):
    response: str
    intent: str
    data: dict | None = None


def parse_query(query: str, db: Session) -> tuple[str, str, dict | None]:
    q = query.strip()
    
    # 1. Where is employee [Name] seated?
    m = re.search(r"(?:where is employee|where is|seat of|where is emp)\s+([a-zA-Z0-9\s_.-]+?)(?:\s+seated|\s+sitting|\?|$)", q, re.IGNORECASE)
    if m:
        name = m.group(1).strip()
        emp = db.query(Employee).filter(Employee.name.ilike(f"%{name}%")).first()
        if not emp:
            return "find_employee_seat", f"I couldn't find an employee named '{name}' in the directory.", None
        
        if emp.active_seat:
            seat = emp.active_seat
            return (
                "find_employee_seat",
                f"Employee {emp.name} ({emp.employee_code}) is seated at Floor {seat.floor}, Zone {seat.zone}, Bay {seat.bay}, Seat {seat.seat_number}.",
                {"employee_id": emp.id, "seat_id": seat.id, "seat_number": seat.seat_number}
            )
        else:
            return "find_employee_seat", f"Employee {emp.name} ({emp.employee_code}) does not have an active seat allocation.", None

    # 2. Who sits near [Name]?
    m = re.search(r"who\s+(?:sits|is seated|sits next to|is near)\s+(?:near|next to|to)\s+([a-zA-Z0-9\s_.-]+?)(?:\?|$)", q, re.IGNORECASE) or re.search(r"neighbors\s+of\s+([a-zA-Z0-9\s_.-]+?)(?:\?|$)", q, re.IGNORECASE)
    if m:
        name = m.group(1).strip()
        emp = db.query(Employee).filter(Employee.name.ilike(f"%{name}%")).first()
        if not emp:
            return "find_neighbors", f"I couldn't find an employee named '{name}' to check neighbors.", None
        
        if not emp.active_seat:
            return "find_neighbors", f"Employee {emp.name} does not have an active seat, so I cannot find neighbors.", None
            
        seat = emp.active_seat
        nearby_seats = db.query(Seat).filter(
            Seat.floor == seat.floor,
            Seat.zone == seat.zone,
            Seat.id != seat.id,
            Seat.status == SeatStatus.OCCUPIED.value
        ).all()
        
        if not nearby_seats:
            return "find_neighbors", f"Employee {emp.name} is seated at Floor {seat.floor}, Zone {seat.zone}, Bay {seat.bay}, Seat {seat.seat_number}. There are no other employees seated in Zone {seat.zone}.", None
            
        neighbors = []
        for s in nearby_seats:
            if s.active_employee:
                neighbors.append(f"{s.active_employee.name} (Seat {s.seat_number}, Bay {s.bay})")
        
        return (
            "find_neighbors",
            f"The employees sitting near {emp.name} in Zone {seat.zone} are:\n" + "\n".join(f"- {n}" for n in neighbors),
            {"floor": seat.floor, "zone": seat.zone}
        )

    # 3. Which project is [Name] assigned to?
    m = re.search(r"(?:which project is|what project is|project of|project assigned to)\s+([a-zA-Z0-9\s_.-]+?)(?:\s+assigned to|\s+on|\?|$)", q, re.IGNORECASE)
    if m:
        name = m.group(1).strip()
        emp = db.query(Employee).filter(Employee.name.ilike(f"%{name}%")).first()
        if not emp:
            return "find_employee_project", f"I couldn't find an employee named '{name}'.", None
        
        project = emp.project
        return (
            "find_employee_project",
            f"Employee {emp.name} is assigned to Project '{project.name}' (Manager: {project.manager_name}, Status: {project.status}).",
            {"employee_id": emp.id, "project_id": project.id, "project_name": project.name}
        )

    # 4. Show available seats on Floor [Number].
    m = re.search(r"(?:show|list|find|get)\s+(?:available|free|vacant)\s+seats\s+on\s+(?:floor\s+)?([a-zA-Z0-9]+?)(?:\?|$)", q, re.IGNORECASE)
    if m:
        floor_num = m.group(1).strip()
        floor_key = floor_num if floor_num.startswith("F") else f"F{floor_num}"
        
        seats = db.query(Seat).filter(
            Seat.floor.ilike(floor_key),
            Seat.status == SeatStatus.AVAILABLE.value
        ).all()
        
        if not seats:
            return "list_available_seats_on_floor", f"There are no available seats on Floor {floor_key}.", None
            
        seat_list = [f"Seat {s.seat_number} (Zone {s.zone}, Bay {s.bay})" for s in seats[:15]]
        remaining = len(seats) - 15
        suffix = f"\n... and {remaining} more available seats." if remaining > 0 else ""
        return (
            "list_available_seats_on_floor",
            f"Found {len(seats)} available seats on Floor {floor_key}:\n" + "\n".join(f"- {s}" for s in seat_list) + suffix,
            {"floor": floor_key, "count": len(seats)}
        )

    # 5. Seat utilization for Project [Name].
    m = re.search(r"seat\s+utilization\s+for\s+project\s+([a-zA-Z0-9\s_.-]+?)(?:\?|$)", q, re.IGNORECASE) or re.search(r"utilization\s+of\s+([a-zA-Z0-9\s_.-]+?)(?:\?|$)", q, re.IGNORECASE)
    if m:
        proj_name = m.group(1).strip()
        project = db.query(Project).filter(Project.name.ilike(f"%{proj_name}%")).first()
        if not project:
            return "project_utilization", f"I couldn't find a project named '{proj_name}'.", None
            
        total_emp = db.query(Employee).filter(Employee.project_id == project.id).count()
        allocated_emp = db.query(SeatAllocation).filter(
            SeatAllocation.project_id == project.id,
            SeatAllocation.allocation_status == AllocationStatus.ACTIVE.value
        ).count()
        
        rate = (allocated_emp / total_emp * 100) if total_emp > 0 else 0
        return (
            "project_utilization",
            f"Seat utilization details for Project '{project.name}':\n- Total Employees: {total_emp}\n- Allocated Employees: {allocated_emp}\n- Utilization Rate: {rate:.1f}%",
            {"project_id": project.id, "project_name": project.name, "utilization_rate": rate}
        )

    # 6. Allocate a seat for a new employee.
    if re.search(r"allocate\s+(?:a\s+)?seat", q, re.IGNORECASE) or re.search(r"assign\s+(?:a\s+)?seat", q, re.IGNORECASE):
        m_details = re.search(r"allocate\s+(?:seat\s+)?([a-zA-Z0-9]+)\s+to\s+(?:employee\s+)?([a-zA-Z0-9\s_.-]+?)\s+for\s+(?:project\s+)?([a-zA-Z0-9\s_.-]+?)(?:\?|$)", q, re.IGNORECASE)
        if m_details:
            seat_num = m_details.group(1).strip()
            emp_name = m_details.group(2).strip()
            proj_name = m_details.group(3).strip()
            
            emp = db.query(Employee).filter(Employee.name.ilike(f"%{emp_name}%")).first()
            seat = db.query(Seat).filter(Seat.seat_number.ilike(seat_num)).first()
            project = db.query(Project).filter(Project.name.ilike(f"%{proj_name}%")).first()
            
            if not emp:
                return "allocate_seat", f"Employee '{emp_name}' not found.", None
            if not seat:
                return "allocate_seat", f"Seat '{seat_num}' not found.", None
            if not project:
                return "allocate_seat", f"Project '{proj_name}' not found.", None
                
            alloc_service = AllocationService(db)
            try:
                alloc_service.allocate(emp.id, seat.id, project.id)
                return (
                    "allocate_seat",
                    f"Successfully allocated Seat {seat.seat_number} to Employee {emp.name} for Project {project.name}.",
                    {"employee_id": emp.id, "seat_id": seat.id, "project_id": project.id}
                )
            except Exception as e:
                detail = getattr(e, "detail", str(e))
                return "allocate_seat", f"Allocation failed: {detail}", None
                
        return (
            "allocate_seat_prompt",
            "To allocate a seat, please visit the **Seat Allocation** page, or ask me directly using the template:\n*\"Allocate seat [Seat Number] to employee [Employee Name] for project [Project Name]\"*",
            None
        )

    # 7. Release employee seat.
    if re.search(r"release\s+(?:employee\s+)?seat", q, re.IGNORECASE) or re.search(r"free\s+(?:employee\s+)?seat", q, re.IGNORECASE):
        m_details = re.search(r"(?:release|free)\s+(?:seat\s+)?([a-zA-Z0-9]+)(?:\?|$)", q, re.IGNORECASE)
        if m_details:
            seat_num = m_details.group(1).strip()
            seat = db.query(Seat).filter(Seat.seat_number.ilike(seat_num)).first()
            if not seat:
                return "release_seat", f"Seat '{seat_num}' not found.", None
                
            alloc_service = AllocationService(db)
            try:
                alloc_service.release(seat.id)
                return (
                    "release_seat",
                    f"Successfully released Seat {seat.seat_number}. It is now Available.",
                    {"seat_id": seat.id, "seat_number": seat.seat_number}
                )
            except Exception as e:
                detail = getattr(e, "detail", str(e))
                return "release_seat", f"Release failed: {detail}", None
                
        return (
            "release_seat_prompt",
            "To release a seat, please specify the seat number, for example: *\"Release seat 11101\"*.",
            None
        )

    # Fallback default response
    return (
        "unknown",
        "Hello! I am your AI Assistant. I can help you search for employees, find their seats or projects, list available seats on any floor, find neighboring seating, show project utilization, and allocate or release seats. Try asking me:\n\n"
        "- *Where is employee Employee 1 seated?*\n"
        "- *Which project is Employee 1 assigned to?*\n"
        "- *Show available seats on Floor 3.*\n"
        "- *Who sits near Employee 1?*\n"
        "- *Seat utilization for Project Indigo.*\n"
        "- *Allocate seat 11101 to employee Employee 1 for project Indigo*\n"
        "- *Release seat 11101*",
        None
    )


@router.post("/query", response_model=AIQueryResponse)
def query_ai_assistant(payload: AIQueryRequest, db: Session = Depends(get_db)):
    intent, response, data = parse_query(payload.query, db)
    return AIQueryResponse(response=response, intent=intent, data=data)
