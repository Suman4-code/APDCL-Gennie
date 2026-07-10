from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any
from backend.app import models, schemas
from backend.app.database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/analytics", response_model=schemas.AnalyticsDashboard)
def get_analytics(db: Session = Depends(get_db)):
    # 1. Total Chats (number of distinct session_ids or total messages)
    total_messages = db.query(models.ChatMessage).count()
    
    # 2. Complaints stats
    total_complaints = db.query(models.Complaint).count()
    resolved_complaints = db.query(models.Complaint).filter(models.Complaint.status == "Resolved").count()
    pending_complaints = total_complaints - resolved_complaints
    
    # 3. Satisfaction rate (thumbs up = 5, thumbs down = 1)
    ratings = db.query(models.ChatMessage.feedback_rating).filter(models.ChatMessage.feedback_rating.isnot(None)).all()
    satisfaction_rate = 100.0
    if ratings:
        thumbs_up = sum(1 for r in ratings if r[0] >= 4)
        satisfaction_rate = (thumbs_up / len(ratings)) * 100.0
        
    # 4. Complaint Category Distribution
    category_counts = db.query(
        models.Complaint.category, 
        func.count(models.Complaint.id)
    ).group_by(models.Complaint.category).all()
    
    complaint_categories = [
        schemas.CategoryStat(category=cat, count=cnt) for cat, cnt in category_counts
    ]
    if not complaint_categories:
        complaint_categories = [
            schemas.CategoryStat(category="Power Failure", count=0),
            schemas.CategoryStat(category="Billing Issue", count=0),
            # Mock entries for default visual setup
        ]
        
    # 5. Intent distribution
    intent_counts = db.query(
        models.ChatMessage.intent, 
        func.count(models.ChatMessage.id)
    ).filter(models.ChatMessage.intent.isnot(None))\
     .group_by(models.ChatMessage.intent).all()
     
    intent_distribution = {intent: cnt for intent, cnt in intent_counts}
    if not intent_distribution:
        intent_distribution = {"greeting": 0, "billing": 0, "complaint": 0, "tariff": 0, "faq": 0}
        
    # 6. Daily volume (last 7 days)
    daily_volume = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        next_day = day + timedelta(days=1)
        cnt = db.query(models.ChatMessage).filter(
            models.ChatMessage.timestamp >= datetime.combine(day, datetime.min.time()),
            models.ChatMessage.timestamp < datetime.combine(next_day, datetime.min.time())
        ).count()
        daily_volume.append({"date": day.strftime("%Y-%m-%d"), "chats": cnt})
        
    return schemas.AnalyticsDashboard(
        total_chats=total_messages,
        total_complaints=total_complaints,
        resolved_complaints=resolved_complaints,
        pending_complaints=pending_complaints,
        user_satisfaction_rate=round(satisfaction_rate, 1),
        complaint_categories=complaint_categories,
        intent_distribution=intent_distribution,
        daily_volume=daily_volume
    )

@router.get("/chats", response_model=List[schemas.ChatMessageResponse])
def get_recent_chats(limit: int = 100, db: Session = Depends(get_db)):
    chats = db.query(models.ChatMessage).order_by(models.ChatMessage.timestamp.desc()).limit(limit).all()
    return chats

@router.get("/complaints", response_model=List[schemas.ComplaintResponse])
def get_all_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).order_by(models.Complaint.registration_date.desc()).all()

@router.post("/complaint/{complaint_id}/status")
def update_complaint_status(complaint_id: str, payload: Dict[str, str], db: Session = Depends(get_db)):
    new_status = payload.get("status")
    remarks = payload.get("remarks", "")
    if new_status not in ["Registered", "In Progress", "Resolved", "Closed"]:
        raise HTTPException(status_code=400, detail="Invalid status value")
        
    complaint = db.query(models.Complaint).filter(models.Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint.status = new_status
    complaint.remarks = remarks
    if new_status == "Resolved":
        complaint.resolution_date = datetime.utcnow()
        
    db.commit()
    db.refresh(complaint)
    return complaint
