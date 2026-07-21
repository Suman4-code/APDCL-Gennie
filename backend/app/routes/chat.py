from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.services.rag import APDCLAssistantRAG

router = APIRouter(prefix="/chat", tags=["chat"])
rag_service = APDCLAssistantRAG()

from backend.app.routes.auth import get_optional_user
from backend.app.services.mock_services import get_mock_history

@router.post("/message", response_model=schemas.ChatMessageResponse)
def send_message(msg_in: schemas.ChatMessageCreate, db: Session = Depends(get_db), current_user: models.User | None = Depends(get_optional_user)):
    # 1. Fetch conversation history for context preservation
    history = db.query(models.ChatMessage)\
        .filter(models.ChatMessage.session_id == msg_in.session_id)\
        .order_by(models.ChatMessage.timestamp.asc())\
        .all()
        
    history_list = [{"sender": h.sender, "content": h.content, "entities": h.entities} for h in history]
    
    # 2. Save user message to database
    user_msg_db = models.ChatMessage(
        session_id=msg_in.session_id,
        sender="user",
        content=msg_in.content,
        language=msg_in.language or "en"
    )
    db.add(user_msg_db)
    db.commit()
    db.refresh(user_msg_db)
    
    # Format current user data for RAG
    user_data = None
    if current_user:
        user_data = {
            "consumer_number": current_user.consumer_number,
            "name": current_user.name,
            "current_balance": current_user.current_balance,
            "due_date": current_user.due_date.strftime("%B %d, %Y") if current_user.due_date else "N/A",
            "billing_history": get_mock_history(
                current_user.consumer_number, 
                current_user.category, 
                current_user.last_bill_amount if current_user.last_bill_amount > 0 else abs(current_user.current_balance)
            )
        }
    
    import re
    
    # 3. Handle unauthenticated consumer number lookup
    # If the user is not logged in but provides an 11-digit number, look it up in the database.
    found_numbers = re.findall(r'\b\d{11}\b', msg_in.content)
    if not current_user and found_numbers:
        consumer_no = found_numbers[0]
        db_user = db.query(models.User).filter(models.User.consumer_number == consumer_no).first()
        
        if not db_user:
            rag_out = {
                "content": f"I could not find any records for Consumer Number {consumer_no}. Please ensure you have entered a valid 11-digit APDCL consumer number.",
                "intent": "error",
                "entities": {"consumer_number": consumer_no},
                "language": msg_in.language or "en"
            }
        else:
            # User found, simulate current_user for the RAG engine to return billing info
            user_data = {
                "consumer_number": db_user.consumer_number,
                "name": db_user.name,
                "current_balance": db_user.current_balance,
                "due_date": db_user.due_date.strftime("%B %d, %Y") if db_user.due_date else "N/A",
                "billing_history": get_mock_history(
                    db_user.consumer_number, 
                    db_user.category, 
                    db_user.last_bill_amount if db_user.last_bill_amount > 0 else abs(db_user.current_balance)
                )
            }
            # Force intent to billing since they provided a consumer number
            rag_out = rag_service.generate_response("check bill", history_list, override_language=msg_in.language, user_data=user_data)
            
    # 4. Generate response using RAG Service (Standard Flow)
    else:
        try:
            rag_out = rag_service.generate_response(msg_in.content, history_list, override_language=msg_in.language, user_data=user_data)
        except Exception as e:
            rag_out = {
                "content": f"I apologize, but I encountered an error processing your query. Please try again. (Detail: {str(e)})",
                "intent": "error",
                "entities": "{}",
                "language": "en",
                "citation": "System Alert"
            }
        
    # Update user message with intent/entities
    user_msg_db.intent = rag_out.get("intent", "general")
    entities_data = rag_out.get("entities", {})
    user_msg_db.entities = json.dumps(entities_data) if isinstance(entities_data, dict) else str(entities_data)
    user_msg_db.language = rag_out.get("language", "en")
    
    # 4. Save bot response to database
    bot_msg_db = models.ChatMessage(
        session_id=msg_in.session_id,
        sender="bot",
        content=rag_out["content"],
        intent=rag_out.get("intent", "general"),
        entities=user_msg_db.entities,
        language=rag_out.get("language", "en")
    )
    db.add(bot_msg_db)
    db.commit()
    db.refresh(bot_msg_db)
    
    return bot_msg_db

@router.get("/history/{session_id}", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    history = db.query(models.ChatMessage)\
        .filter(models.ChatMessage.session_id == session_id)\
        .order_by(models.ChatMessage.timestamp.asc())\
        .all()
    return history

@router.post("/feedback/{message_id}", response_model=schemas.ChatMessageResponse)
def submit_feedback(message_id: int, feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.feedback_rating = feedback.feedback_rating
    msg.rating_comment = feedback.rating_comment
    db.commit()
    db.refresh(msg)
    return msg
