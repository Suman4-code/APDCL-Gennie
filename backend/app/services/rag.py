import os
import json
import google.generativeai as genai
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables (e.g. GEMINI_API_KEY)
load_dotenv()

class APDCLAssistantRAG:
    def __init__(self, kb_path: str = "app/data/apdcl_kb.json"):
        # Load Knowledge Base strictly for context injection
        try:
            with open(kb_path, "r", encoding="utf-8") as f:
                self.kb = json.load(f)
        except Exception as e:
            self.kb = {}
            print(f"Warning: Failed to load APDCL knowledge base. Error: {e}")
            
        # Configure Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        self.ai_enabled = False
        if api_key and api_key != "your_api_key_here":
            genai.configure(api_key=api_key)
            self.ai_enabled = True
            
            # System prompt strictly restricting the AI to APDCL context and basics
            self.system_instruction = (
                "You are APDCL GENNIE, the official virtual assistant for Assam Power Distribution Company Limited (APDCL). "
                "Your role is to assist users with electricity billing, tariff plans, complaint registration, power outages, and basic greetings. "
                "You must strictly follow these rules:\n"
                "1. Answer questions primarily using the APDCL Knowledge Base provided to you.\n"
                "2. If the user asks for their billing information, use the provided 'User Billing Data' to give them their outstanding balance and due date.\n"
                "3. You may engage in basic, polite human interaction (e.g., 'Hello', 'How are you?', 'Thank you').\n"
                "4. CRITICAL: If the user asks questions completely unrelated to APDCL, electricity, or basic greetings, you MUST politely refuse.\n"
                "5. ACTION LINKS: If the user asks about a service, ALWAYS provide a direct markdown link at the end of your response to direct them. "
                "Format it EXACTLY as `[Action Name](URL)`. Here are the valid URLs to use:\n"
                " - Apply for New Connection: `https://www.apdcl.org/website/ApplyNewConn`\n"
                " - Pay Electricity Bill: `https://www.apdcl.org/website/PayBill`\n"
                " - View Electricity Bill: `https://www.apdcl.org/website/ViewBill`\n"
                " - Register Complaint: `https://www.bijuleebandhu.com/complaints`\n"
                " - Recharge Prepaid Meter: `https://www.apdcl.org/website/RechargePrepaid`\n"
                " - Smart Prepaid Balance: `https://www.apdcl.org/website/SmartPrepaidBalance`\n"
                "6. HISTORICAL DATA: If the user asks for their billing history or consumption history, read the `billing_history` array provided in the User Data context. You MUST format this data as a clean Markdown table with columns: Month, Unit Consumption, and Bill/Recharge Amount.\n"
                "7. Keep your responses concise, professional, and friendly. Do not output raw JSON or system details."
            )
            
            self.model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=self.system_instruction
            )

    def _get_fallback_response(self, query: str, user_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Simple seamless fallback if Gemini API key is missing or quota is exceeded."""
        query = query.lower()
        
        # If user data (billing data) is provided, we can directly give them their bill info!
        if user_data:
            name = user_data.get("name", "Customer")
            balance = user_data.get("current_balance", 0)
            due_date = user_data.get("due_date", "N/A")
            return {
                "content": f"Hello {name}, your current outstanding electricity bill is ₹{balance}. The due date for payment is {due_date}.\n\n[Pay Electricity Bill](https://www.apdcl.org/website/PayBill)\n[View Electricity Bill](https://www.apdcl.org/website/ViewBill)",
                "intent": "billing",
                "entities": user_data,
                "language": "en",
            }

        if any(w in query for w in ["bill", "balance", "due", "pay"]):
            return {
                "content": "To assist you with your bill details, please provide your 11-digit Consumer Number or login to your account.\n\n[Pay Electricity Bill](https://www.apdcl.org/website/PayBill)",
                "intent": "billing",
                "entities": {},
                "language": "en",
            }
        elif any(w in query for w in ["hi", "hello", "hey"]):
            return {
                "content": "Hello! I am APDCL Gennie, your virtual assistant. I can help you check your electricity bill, find out your balance, or register a complaint. How can I assist you today?\n\n[Pay Electricity Bill](https://www.apdcl.org/website/PayBill)\n[Apply for New Connection](https://www.apdcl.org/website/ApplyNewConn)\n[Register Complaint](https://www.bijuleebandhu.com/complaints)",
                "intent": "general",
                "entities": {},
                "language": "en",
            }
        elif any(w in query for w in ["complain", "issue", "power cut", "outage", "problem"]):
            return {
                "content": "I am sorry to hear you are facing an issue. To register a complaint or report a power outage, please use the Quick Services menu or provide your 11-digit Consumer Number.\n\n[Register Complaint](https://www.bijuleebandhu.com/complaints)",
                "intent": "complaint",
                "entities": {},
                "language": "en",
            }
        
        return {
            "content": "I am here to assist you with APDCL services. You can ask me to check your bill, report an issue, or you can use the Quick Services buttons below. To check your bill right away, please provide your 11-digit Consumer Number.\n\n[Pay Electricity Bill](https://www.apdcl.org/website/PayBill)\n[View Electricity Bill](https://www.apdcl.org/website/ViewBill)\n[Register Complaint](https://www.bijuleebandhu.com/complaints)",
            "intent": "general",
            "entities": {},
            "language": "en"
        }

    def generate_response(self, query: str, history: List[Dict[str, Any]] = None, override_language: str = None, user_data: Dict[str, Any] = None) -> Dict[str, Any]:
        
        if not self.ai_enabled:
            # If no API key is provided, gracefully fallback to the basic dummy responder
            return self._get_fallback_response(query, user_data)
            
        history = history or []
        
        # Determine intent for tracking (Gemini will handle the actual conversation)
        intent = "general"
        query_lower = query.lower()
        if any(w in query_lower for w in ["bill", "balance", "due", "pay"]):
            intent = "billing"
        elif any(w in query_lower for w in ["complain", "issue", "power cut", "outage"]):
            intent = "complaint"
            
        # Build Context Prompt
        context_parts = []
        
        # Inject Knowledge Base
        kb_text = json.dumps(self.kb, indent=2)
        context_parts.append(f"--- APDCL Knowledge Base ---\n{kb_text}\n--------------------------")
        
        # Inject User Data if available
        if user_data:
            user_text = json.dumps(user_data, indent=2)
            context_parts.append(f"--- Authenticated User Billing Data ---\n{user_text}\n--------------------------")
        elif intent == "billing":
            context_parts.append("--- Notice: The user is asking about a bill, but NO consumer data is provided. Ask them to provide their 11-digit Consumer Number. ---")
            
        # Combine everything for the model
        full_context = "\n\n".join(context_parts)
        
        # Convert history format to Gemini Chat format
        gemini_history = []
        for msg in history:
            role = "user" if msg["sender"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})
            
        # Insert context block as a silent system message at the beginning of history
        # (Since Gemini 1.5/2.5 supports system_instructions, we just pass dynamic context via the first user message if history is empty)
        
        try:
            # Start chat session
            chat = self.model.start_chat(history=gemini_history)
            
            # Combine current query with the dynamic context
            prompt = f"{full_context}\n\nUser Message: {query}"
            
            response = chat.send_message(prompt)
            
            return {
                "content": response.text.strip(),
                "intent": intent,
                "entities": {},
                "language": override_language or "en"
            }
            
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback to basic mode if API limit is reached
            return self._get_fallback_response(query, user_data)
