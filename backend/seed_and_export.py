import csv
import os
import sys

# Add project root to sys.path so we can import backend.app modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import User
from backend.app.routes.auth import get_password_hash

def run():
    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    users_to_create = [
        ("10234567890", "Rahul Sharma", "9876543210", 1450.50),
        ("10234567891", "Priya Das", "9876543211", 0.0),
        ("10234567892", "Amitabh Barua", "9876543212", 530.00),
        ("10234567893", "Sneha Gogoi", "9876543213", 2100.75),
        ("10234567894", "Vikram Singh", "9876543214", 120.00)
    ]
    
    print("Seeding Users...")
    for cons_no, name, mobile, bal in users_to_create:
        existing = db.query(User).filter(User.consumer_number == cons_no).first()
        if not existing:
            new_user = User(
                consumer_number=cons_no,
                name=name,
                mobile=mobile,
                password_hash=get_password_hash("password123"),
                subdivision="Dispur Subdivision",
                address="Guwahati, Assam",
                category="LT-II: Domestic-A",
                connected_load=2.0,
                current_balance=bal
            )
            db.add(new_user)
    
    db.commit()
    
    print("Exporting to CSV...")
    csv_path = r"C:\Users\lenovo\.gemini\antigravity\brain\d3027db8-20c3-47e2-aeff-d1e6e410a72c\apdcl_users.csv"
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Consumer Number", "Name", "Mobile", "Password", "Balance (Rs)"])
        for cons_no, name, mobile, bal in users_to_create:
            writer.writerow([cons_no, name, mobile, "password123", bal])
            
    print(f"Export Complete: {csv_path}")

if __name__ == "__main__":
    run()
