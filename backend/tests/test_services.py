import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from io import BytesIO
from backend.app.main import app
from backend.app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_apdcl_services.db"
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

def test_complaints_endpoints():
    # 1. Lodge complaint
    payload = {
        "category": "Power Outage",
        "description": "Electricity went out 2 hours ago. Total blackout.",
        "consumer_number": "10000000001"
    }
    response = client.post("/api/services/complaint", data=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Registered"
    assert data["consumer_number"] == "10000000001"
    assert "complaint_id" in data
    
    complaint_id = data["complaint_id"]
    
    # 2. Track complaint
    response = client.get(f"/api/services/complaint/{complaint_id}")
    assert response.status_code == 200
    track_data = response.json()
    assert track_data["complaint_id"] == complaint_id
    assert track_data["status"] == "Registered"

def test_outages_endpoint():
    response = client.get("/api/services/outages")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
def test_ocr_billing():
    # Submit mock bill upload
    file_data = BytesIO(b"dummy bill content")
    response = client.post(
        "/api/services/ocr",
        files={"file": ("bill_statement.png", file_data, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == "electricity_bill"
    assert "consumer_number" in data["extracted_data"]
    assert "amount_due" in data["extracted_data"]

def test_ocr_meter():
    # Submit mock meter upload
    file_data = BytesIO(b"dummy meter content")
    response = client.post(
        "/api/services/ocr",
        files={"file": ("meter_reading_june.jpg", file_data, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == "meter_reading"
    assert "current_reading" in data["extracted_data"]
