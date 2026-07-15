from __future__ import annotations

from datetime import date, timedelta
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
    "Bedegreed",
    "Opreed",
    "Serry",
    "Kaary",
    "Mered",
]

DEPARTMENTS = [
    "Engineering",
    "Operations",
    "HR",
    "Finance",
    "Marketing",
    "Sales",
    "Product",
    "Support",
    "Legal",
    "Security",
    "IT",
]

ROLES = [
    "Engineer",
    "Manager",
    "Associate",
    "Lead",
    "Director",
    "Analyst",
    "Recruiter",
]


def seed_database(session: Session) -> None:
    # Clear existing tables to ensure exact target counts are seeded
    session.query(SeatAllocation).delete()
    session.query(Seat).delete()
    session.query(Employee).delete()
    session.query(Project).delete()
    session.commit()

    # 1. Create 11 Projects
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

    # 2. Create 5500 Seats
    # 5 Floors * 5 Zones * 4 Bays = 100 combinations.
    # 55 seats per combination = 5500 seats.
    seats: list[Seat] = []
    seat_counter = 0
    
    floors = ["F1", "F2", "F3", "F4", "F5"]
    zones = ["A", "B", "C", "D", "E"]
    bays = ["B1", "B2", "B3", "B4"]
    
    for f_idx, floor in enumerate(floors, start=1):
        for z_idx, zone in enumerate(zones, start=1):
            for b_idx, bay in enumerate(bays, start=1):
                for seat_idx in range(1, 56):
                    seat_num = f"{f_idx}{z_idx}{b_idx}{seat_idx:02d}"
                    seats.append(
                        Seat(
                            floor=floor,
                            zone=zone,
                            bay=bay,
                            seat_number=seat_num,
                            status=SeatStatus.AVAILABLE.value,
                        )
                    )
    
    # 3. Create 5000 Employees
    employees: list[Employee] = []
    start_date = date(2025, 1, 1)
    for index in range(1, 5001):
        dept = DEPARTMENTS[index % len(DEPARTMENTS)]
        role = ROLES[index % len(ROLES)]
        proj = projects[index % len(projects)]
        employees.append(
            Employee(
                employee_code=f"EMP-{index:05d}",
                name=f"Employee {index}",
                email=f"employee{index}@ethara.com",
                department=dept,
                role=role,
                joining_date=start_date + timedelta(days=index % 365),
                employment_status=EmployeeStatus.ACTIVE.value,
                project_id=proj.id,
            )
        )

    # Bulk add and flush to generate IDs
    # To be fast, add in chunks or add_all followed by flush
    session.add_all(seats)
    session.add_all(employees)
    session.flush()

    # Define allocation structure:
    # 4900 Occupied seats, allocated to employees 1 to 4900
    # 100 Reserved seats (seats 4901 to 5000)
    # 500 Available seats (seats 5001 to 5500)
    # 50 Pending allocations for employees 4901 to 4950 (allocated to seats 5001 to 5050 with status PENDING)
    # 50 Unallocated employees (employees 4951 to 5000)
    
    # Set 4900 occupied seats
    allocations: list[SeatAllocation] = []
    for index in range(4900):
        emp = employees[index]
        seat = seats[index]
        
        seat.status = SeatStatus.OCCUPIED.value
        seat.active_employee_id = emp.id
        
        allocations.append(
            SeatAllocation(
                employee_id=emp.id,
                seat_id=seat.id,
                project_id=emp.project_id,
                allocation_status=AllocationStatus.ACTIVE.value,
            )
        )
        
    # Set 100 reserved seats
    for index in range(4900, 5000):
        seats[index].status = SeatStatus.RESERVED.value

    # Set 50 pending allocations on Available seats (indices 5000 to 5049)
    for index in range(50):
        emp = employees[4900 + index]
        seat = seats[5000 + index] # Keep seat status as Available, but record a pending allocation
        
        allocations.append(
            SeatAllocation(
                employee_id=emp.id,
                seat_id=seat.id,
                project_id=emp.project_id,
                allocation_status=AllocationStatus.PENDING.value,
            )
        )
        
    session.add_all(allocations)
    session.commit()
if __name__ == "__main__":
    from app.database.session import SessionLocal

    db = SessionLocal()
    try:
        print("Starting Ethara database seed...")
        seed_database(db)
        print("Seed completed successfully.")
        print("Created 11 projects.")
        print("Created 5,000 employees.")
        print("Created 5,500 seats.")
        print("Created 4,900 active allocations.")
        print("Created 50 pending allocations.")
    except Exception:
        db.rollback()
        print("Seed failed.")
        raise
    finally:
        db.close()
