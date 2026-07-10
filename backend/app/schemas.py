from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    consumer_number: Optional[str] = None

class UserCreate(BaseModel):
    consumer_number: str = Field(..., min_length=11, max_length=11)
    name: str
    mobile: str
    email: Optional[str] = None
    password: str
    subdivision: str
    address: str
    category: Optional[str] = "LT-II: Domestic-A"
    connected_load: Optional[float] = 2.0

class UserLogin(BaseModel):
    consumer_number: str
    password: str

class UserResponse(BaseModel):
    consumer_number: str
    name: str
    mobile: str
    email: Optional[str]
    subdivision: str
    address: str
    category: str
    connected_load: float
    current_balance: float
    last_bill_amount: float
    last_bill_date: Optional[datetime]
    due_date: Optional[datetime]

    class Config:
        from_attributes = True

# Chat Schemas
class ChatMessageCreate(BaseModel):
    content: str
    session_id: str
    language: Optional[str] = "en"

class ChatMessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    timestamp: datetime
    intent: Optional[str] = None
    entities: Optional[str] = None # JSON string
    language: str
    feedback_rating: Optional[int] = None
    rating_comment: Optional[str] = None

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    feedback_rating: int = Field(..., ge=1, le=5) # 1 = Thumbs Down, 5 = Thumbs Up
    rating_comment: Optional[str] = None

# Complaint Schemas
class ComplaintCreate(BaseModel):
    category: str
    description: str

class ComplaintResponse(BaseModel):
    complaint_id: str
    consumer_number: str
    category: str
    description: str
    status: str
    registration_date: datetime
    resolution_date: Optional[datetime] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class OutageResponse(BaseModel):
    id: int
    subdivision: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True

# Analytics / Admin Schemas
class CategoryStat(BaseModel):
    category: str
    count: int

class AnalyticsDashboard(BaseModel):
    total_chats: int
    total_complaints: int
    resolved_complaints: int
    pending_complaints: int
    user_satisfaction_rate: float # Percentage of thumbs up
    complaint_categories: List[CategoryStat]
    intent_distribution: Dict[str, int]
    daily_volume: List[Dict[str, Any]]
