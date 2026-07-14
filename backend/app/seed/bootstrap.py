from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.models.allocation import SeatAllocation
from app.models.employee import Employee
from app.models.enums import AllocationStatus, EmployeeStatus, ProjectStatus, SeatStatus
from app.models.project import Project
from app.models.seat import Seat

PROJECT_NAMES = [
    "Indigo",
    "Indreed",
    "Mydreed",
    "Preed",
    "Serfy",
    "Oreed",
    "bedegreed",
    "Opreed",
    "Serry",
    "Kaary",
    "Mered",
]


def seed_database(session: Session) -> None:
    if session.query(Project).count() > 0:
        return

    projects: list[Project] = []
    for project_name in PROJECT_NAMES:
        projects.append(
            Project(
                name=project_name,
                description=f"Seeded project record for {project_name}.",
                manager_name=f"Manager {project_name}",
                status=ProjectStatus.ACTIVE.value,
            )
        )
    session.add_all(projects)
    session.flush()

    employees: list[Employee] = []
    for index in range(1, 21):
        employees.append(
            Employee(
                employee_code=f"EMP-{index:05d}",
                name=f"Employee {index}",
                email=f"employee{index}@ethara.local",
                department="Operations",
                role="Associate",
                joining_date=date(2025, 1, min(index, 28)),
                employment_status=EmployeeStatus.ACTIVE.value,
                project_id=projects[index % len(projects)].id,
            )
        )
    session.add_all(employees)
    session.flush()

    seats: list[Seat] = []
    for floor in range(1, 4):
        for zone_index, zone in enumerate(["A", "B", "C"], start=1):
            for bay in range(1, 3):
                for seat_index in range(1, 6):
                    seats.append(
                        Seat(
                            floor=f"F{floor}",
                            zone=zone,
                            bay=f"B{bay}",
                            seat_number=f"{floor}{zone_index}{bay}{seat_index:02d}",
                            status=SeatStatus.AVAILABLE.value,
                        )
                    )
    for seat in seats[:5]:
        seat.status = SeatStatus.RESERVED.value
    session.add_all(seats)
    session.flush()

    allocations: list[SeatAllocation] = []
    for index in range(1, 6):
        allocations.append(
            SeatAllocation(
                employee_id=employees[index - 1].id,
                seat_id=seats[index + 4].id,
                project_id=employees[index - 1].project_id,
                allocation_status=AllocationStatus.ACTIVE.value,
            )
        )
        seats[index + 4].status = SeatStatus.OCCUPIED.value
        seats[index + 4].active_employee_id = employees[index - 1].id
    session.add_all(allocations)
    session.commit()
