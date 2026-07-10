import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app import models

def get_mock_bill(consumer_number: str) -> Dict[str, Any]:
    """Generates standard billing details for mock query responses"""
    # Deterministic generation based on the consumer number digits
    random.seed(consumer_number)
    outstanding = round(random.uniform(500, 4500), 2)
    load = random.choice([1.0, 2.0, 3.0, 5.0, 10.0])
    category = "LT-II: Domestic-A" if load < 5.0 else ("LT-III: Domestic-B" if load <= 30.0 else "LT-IV: Commercial")
    
    last_bill_amount = round(outstanding * 0.9, 2)
    due_date = datetime.now() + timedelta(days=random.randint(5, 15))
    
    subdivisions = ["Kahilipara Subdivision", "Dispur Subdivision", "Ulubari Subdivision", "Maligaon Subdivision"]
    subdivision = random.choice(subdivisions)
    
    return {
        "consumer_number": consumer_number,
        "name": f"Consumer_{consumer_number[-4:]}",
        "mobile": f"+9198765{consumer_number[-5:]}",
        "email": f"user_{consumer_number[-4:]}@gmail.com",
        "subdivision": subdivision,
        "address": f"H.No. {random.randint(1, 200)}, Guwahati, Assam",
        "category": category,
        "connected_load": load,
        "current_balance": -outstanding, # Negative balance is outstanding
        "last_bill_amount": last_bill_amount,
        "last_bill_date": datetime.now() - timedelta(days=20),
        "due_date": due_date
    }

def get_db_or_mock_user(db: Session, consumer_number: str) -> models.User:
    """Finds user in database or creates one with mock data for instant demo flow"""
    db_user = db.query(models.User).filter(models.User.consumer_number == consumer_number).first()
    if db_user:
        return db_user
    
    # User not in database, create one on the fly to simulate real accounts
    info = get_mock_bill(consumer_number)
    
    # Create password hash for 'password123'
    import bcrypt
    hashed_password = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = models.User(
        consumer_number=consumer_number,
        name=info["name"],
        mobile=info["mobile"],
        email=info["email"],
        password_hash=hashed_password,
        subdivision=info["subdivision"],
        address=info["address"],
        category=info["category"],
        connected_load=info["connected_load"],
        current_balance=info["current_balance"],
        last_bill_amount=info["last_bill_amount"],
        last_bill_date=info["last_bill_date"],
        due_date=info["due_date"]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def seed_initial_outages(db: Session):
    """Seed planned and unplanned outage lists if table is empty"""
    if db.query(models.Outage).count() > 0:
        return
        
    subdivisions = ["Kahilipara", "Dispur", "Ulubari", "Maligaon", "Jalukbari"]
    reasons = [
        "11KV Line maintenance work and tree branch cutting",
        "Transformer replacement and upgrade of sub-station",
        "Pole relocation for local highway widening project",
        "Emergency rectification of damaged insulator structure",
        "Routine substation testing and safety grid checks"
    ]
    
    for i in range(15):
        sub = random.choice(subdivisions)
        reason = random.choice(reasons)
        start = datetime.now() + timedelta(days=random.randint(-1, 3), hours=random.randint(1, 10))
        end = start + timedelta(hours=random.randint(2, 5))
        
        status = "Scheduled"
        if start < datetime.now() < end:
            status = "In Progress"
        elif start < datetime.now():
            status = "Restored"
            
        outage = models.Outage(
            subdivision=sub,
            title=f"Shut Down at {sub} Subdivision",
            description=reason,
            start_time=start,
            end_time=end,
            status=status
        )
        db.add(outage)
    db.commit()
