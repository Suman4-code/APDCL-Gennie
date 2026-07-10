from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    consumer_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    mobile = Column(String(15), nullable=False)
    email = Column(String(100), nullable=True)
    password_hash = Column(String(200), nullable=False)
    
    # Billing Info
    subdivision = Column(String(100), nullable=False)
    address = Column(String(250), nullable=False)
    category = Column(String(50), default="LT-II: Domestic-A")
    connected_load = Column(Float, default=2.0) # in kW
    current_balance = Column(Float, default=0.0) # Positive is credit, negative is outstanding
    last_bill_amount = Column(Float, default=0.0)
    last_bill_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    
    complaints = relationship("Complaint", back_populates="user")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True, nullable=False)
    sender = Column(String(20), nullable=False) # 'user' or 'bot'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # NLP / Analytics Metadata
    intent = Column(String(100), nullable=True)
    entities = Column(Text, nullable=True) # JSON serialized dict of extracted entities
    language = Column(String(10), default="en")
    
    # Feedback
    feedback_rating = Column(Integer, nullable=True) # 1 to 5 or binary thumbs up/down
    rating_comment = Column(Text, nullable=True)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True, nullable=False)
    consumer_number = Column(String(50), ForeignKey("users.consumer_number"), nullable=False)
    category = Column(String(100), nullable=False) # Power Failure, Billing, Meter, Voltage, etc.
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Registered") # Registered, In Progress, Resolved, Closed
    registration_date = Column(DateTime, default=datetime.utcnow)
    resolution_date = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="complaints")

class Outage(Base):
    __tablename__ = "outages"

    id = Column(Integer, primary_key=True, index=True)
    subdivision = Column(String(100), index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="Scheduled") # Scheduled, In Progress, Restored, Cancelled
