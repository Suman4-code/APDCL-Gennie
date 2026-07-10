import sys
import os
import uvicorn

# Resolve parent directory to enable importing 'backend.app' modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User
from backend.app.routes.auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Check if we have users, if not, create them
    if not db.query(User).first():
        print("Database is empty. Seeding test users...")
        test_users = [
            ("10234567890", "Rahul Sharma", "9876543210", 1450.50),
            ("10234567891", "Priya Das", "9876543211", 0.0),
            ("10234567892", "Amitabh Barua", "9876543212", 530.00),
            ("10234567893", "Sneha Gogoi", "9876543213", 2100.75),
            ("10234567894", "Vikram Singh", "9876543214", 120.00)
        ]
        for cons_no, name, mobile, bal in test_users:
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
    db.close()

if __name__ == "__main__":
    seed_database()
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
