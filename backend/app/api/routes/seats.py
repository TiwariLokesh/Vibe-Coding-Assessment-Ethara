from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.common import APIResponse, MessageResponse
from app.schemas.seat import SeatCreate, SeatRead, SeatUpdate
from app.services.seat_service import SeatService

router = APIRouter(prefix="/seats", tags=["Seats"])


@router.post("", response_model=APIResponse[SeatRead], status_code=status.HTTP_201_CREATED)
def create_seat(payload: SeatCreate, db: Session = Depends(get_db)):
    service = SeatService(db)
    try:
        seat = service.build_seat(**payload.model_dump())
        db.add(seat)
        db.commit()
        db.refresh(seat)
        return APIResponse(message="Seat created", data=seat)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.get("", response_model=APIResponse[list[SeatRead]])
def list_seats(
    floor: str | None = Query(default=None),
    zone: str | None = Query(default=None),
    bay: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    service = SeatService(db)
    seats = service.seat_repository.list(floor=floor, zone=zone, bay=bay, status=status_filter)
    return APIResponse(message="Seats retrieved", data=list(seats))


@router.get("/available", response_model=APIResponse[list[SeatRead]])
def list_available_seats(zone: str | None = Query(default=None), db: Session = Depends(get_db)):
    service = SeatService(db)
    seats = service.seat_repository.available_in_zone(zone=zone)
    return APIResponse(message="Available seats retrieved", data=list(seats))


@router.get("/{seat_id}", response_model=APIResponse[SeatRead])
def get_seat(seat_id: int, db: Session = Depends(get_db)):
    service = SeatService(db)
    seat = service.get_seat(seat_id)
    return APIResponse(message="Seat retrieved", data=seat)


@router.put("/{seat_id}", response_model=APIResponse[SeatRead])
def update_seat(seat_id: int, payload: SeatUpdate, db: Session = Depends(get_db)):
    service = SeatService(db)
    try:
        seat = service.get_seat(seat_id)
        updated_seat = service.update_seat(seat, **payload.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(updated_seat)
        return APIResponse(message="Seat updated", data=updated_seat)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.delete("/{seat_id}", response_model=MessageResponse)
def delete_seat(seat_id: int, db: Session = Depends(get_db)):
    service = SeatService(db)
    try:
        seat = service.get_seat(seat_id)
        service.delete_seat(seat)
        db.commit()
        return MessageResponse(message="Seat deleted")
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/upload-csv", response_model=APIResponse[dict])
def upload_seats_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    contents = file.file.read()
    buffer = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(buffer)
    
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="Empty CSV file.")
    
    headers = [h.strip().lower().replace(" ", "_") for h in reader.fieldnames]
    reader.fieldnames = headers
    
    required_headers = {"floor", "zone", "bay", "seat_number"}
    missing = required_headers - set(headers)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns in CSV: {', '.join(missing)}"
        )
    
    service = SeatService(db)
    errors = []
    seats_to_create = []
    seen_seats = set()
    
    from app.models.seat import Seat
    from app.models.enums import SeatStatus
    
    status_mapping = {
        "available": SeatStatus.AVAILABLE.value,
        "occupied": SeatStatus.OCCUPIED.value,
        "reserved": SeatStatus.RESERVED.value,
        "maintenance": SeatStatus.MAINTENANCE.value,
    }
    
    for row_idx, row in enumerate(reader, start=2):
        floor = (row.get("floor") or "").strip()
        zone = (row.get("zone") or "").strip()
        bay = (row.get("bay") or "").strip()
        seat_num = (row.get("seat_number") or "").strip()
        status_raw = (row.get("status") or "Available").strip().lower()
        
        if not floor:
            errors.append(f"Row {row_idx}: floor is required.")
            continue
        if not zone:
            errors.append(f"Row {row_idx}: zone is required.")
            continue
        if not bay:
            errors.append(f"Row {row_idx}: bay is required.")
            continue
        if not seat_num:
            errors.append(f"Row {row_idx}: seat_number is required.")
            continue
            
        status_val = status_mapping.get(status_raw)
        if not status_val:
            matched = False
            for val in SeatStatus:
                if val.value.lower() == status_raw:
                    status_val = val.value
                    matched = True
                    break
            if not matched:
                errors.append(f"Row {row_idx}: Status '{status_raw}' is invalid. Allowed: Available, Occupied, Reserved, Maintenance.")
                continue
                
        seat_key = (floor.lower(), zone.lower(), seat_num.lower())
        if seat_key in seen_seats:
            errors.append(f"Row {row_idx}: Duplicate seat '{floor} / {zone} / {seat_num}' in the CSV.")
            continue
            
        if service.seat_repository.get_by_identity(floor, zone, seat_num):
            errors.append(f"Row {row_idx}: Seat '{floor} / {zone} / {seat_num}' already exists in database.")
            continue
            
        seen_seats.add(seat_key)
        seats_to_create.append(
            Seat(
                floor=floor,
                zone=zone,
                bay=bay,
                seat_number=seat_num,
                status=status_val,
                active_employee_id=None
            )
        )
        
    if errors:
        return APIResponse(success=False, message="CSV validation failed", data={"errors": errors, "inserted": 0})
        
    try:
        db.add_all(seats_to_create)
        db.commit()
        return APIResponse(success=True, message=f"Successfully imported {len(seats_to_create)} seats.", data={"inserted": len(seats_to_create)})
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during import: {str(e)}")
