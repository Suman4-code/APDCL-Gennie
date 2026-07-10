import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.database import Base, get_db
import random

# Create in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_apdcl.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_register_and_login():
    # Make a random consumer number to prevent collisions between test runs
    consumer_number = f"10{random.randint(100000000, 999999999)}"
    
    register_payload = {
        "consumer_number": consumer_number,
        "name": "Assam Tester",
        "mobile": "+919876543210",
        "email": "tester@example.com",
        "password": "password123",
        "subdivision": "Dispur Subdivision",
        "address": "Dispur, Guwahati"
    }
    
    # 1. Register User
    response = client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["consumer_number"] == consumer_number
    assert data["name"] == "Assam Tester"
    
    # 2. Login User
    login_payload = {
        "consumer_number": consumer_number,
        "password": "password123"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    # 3. Get Current User info
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    me_data = response.json()
    assert me_data["consumer_number"] == consumer_number
    assert me_data["subdivision"] == "Dispur Subdivision"
