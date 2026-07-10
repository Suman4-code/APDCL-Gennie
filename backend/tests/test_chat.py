import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json
from backend.app.main import app
from backend.app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_apdcl_chat.db"
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

def test_chat_flow_and_nlp():
    session_id = "test-session-12345"
    
    # 1. Test greeting intent detection
    response = client.post("/api/chat/message", json={
        "content": "Hello there! I want to ask about APDCL.",
        "session_id": session_id,
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["sender"] == "bot"
    assert data["intent"] == "greeting"
    assert "help" in data["content"].lower()
    
    # 2. Test tariff inquiry & entity extraction
    response = client.post("/api/chat/message", json={
        "content": "What is the tariff rate for Jeevan Dhara?",
        "session_id": session_id,
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "tariff"
    assert "Jeevan Dhara" in data["content"] or "5.34" in data["content"]
    
    # 3. Test bill check - without consumer number (should prompt user)
    response = client.post("/api/chat/message", json={
        "content": "Check my monthly bill",
        "session_id": session_id,
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert "consumer number" in data["content"].lower()
    
    # 4. Test bill check - with 11-digit consumer number
    response = client.post("/api/chat/message", json={
        "content": "Check bill for 10234567890",
        "session_id": session_id,
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "billing"
    assert "10234567890" in data["content"]
    # Check that consumer number is extracted
    extracted_entities = json.loads(data["entities"])
    assert extracted_entities["consumer_number"] == "10234567890"
    
    # 5. Check History
    response = client.get(f"/api/chat/history/{session_id}")
    assert response.status_code == 200
    history = response.json()
    assert len(history) >= 8 # (4 user messages + 4 bot responses)
    
    # 6. Test Feedback submit
    last_message_id = history[-1]["id"]
    response = client.post(f"/api/chat/feedback/{last_message_id}", json={
        "feedback_rating": 5,
        "rating_comment": "Excellent answer, very clear!"
    })
    assert response.status_code == 200
    feedback_data = response.json()
    assert feedback_data["feedback_rating"] == 5
    assert feedback_data["rating_comment"] == "Excellent answer, very clear!"
