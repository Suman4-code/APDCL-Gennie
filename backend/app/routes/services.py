from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.services.mock_services import get_mock_bill, get_db_or_mock_user
from backend.app.services.ocr import perform_ocr

router = APIRouter(prefix="/services", tags=["services"])

@router.get("/bill/{consumer_number}", response_model=schemas.UserResponse)
def get_bill(consumer_number: str, db: Session = Depends(get_db)):
    if len(consumer_number) != 11 or not consumer_number.isdigit():
        raise HTTPException(status_code=400, detail="Consumer number must be exactly 11 digits.")
    
    # Try to find user in DB, otherwise generate & seed mock user on the fly
    user = get_db_or_mock_user(db, consumer_number)
    return user

@router.post("/complaint", response_model=schemas.ComplaintResponse)
def lodge_complaint(
    category: str = Form(...),
    description: str = Form(...),
    consumer_number: str = Form(...),
    db: Session = Depends(get_db)
):
    if len(consumer_number) != 11 or not consumer_number.isdigit():
        raise HTTPException(status_code=400, detail="Consumer number must be exactly 11 digits.")
        
    # Ensure user exists (seeds if missing)
    user = get_db_or_mock_user(db, consumer_number)
    
    # Generate 9-digit complaint ID (starts with 9)
    import random
    complaint_id = f"9{random.randint(10000000, 99999999)}"
    
    db_complaint = models.Complaint(
        complaint_id=complaint_id,
        consumer_number=consumer_number,
        category=category,
        description=description,
        status="Registered",
        registration_date=datetime.utcnow()
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

@router.get("/complaint/{complaint_id}", response_model=schemas.ComplaintResponse)
def track_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.get("/outages", response_model=List[schemas.OutageResponse])
def get_outages(subdivision: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Outage)
    if subdivision:
        query = query.filter(models.Outage.subdivision.ilike(f"%{subdivision}%"))
    return query.order_by(models.Outage.start_time.desc()).all()

@router.post("/ocr")
async def upload_ocr_file(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        ocr_result = perform_ocr(contents, file.filename)
        return ocr_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing failed: {str(e)}")
