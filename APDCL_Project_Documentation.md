# APDCL Virtual Assistant (v2) - Complete Project Documentation

This document serves as the comprehensive technical specification, architecture overview, and setup guide for the **APDCL Virtual Assistant (v2)** project.

---

## 1. Project Overview
The project is a modernized web application replicating the official Assam Power Distribution Company Limited (APDCL) portal. Its core feature is **"APDCL GENNIE"**, an advanced, floating AI virtual assistant powered by Google Gemini, designed to provide 24/7 automated customer support, bill tracking, and complaint registration.

## 2. Architecture Stack
The application uses a modern decoupled architecture:

### Frontend (Client-Side)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript & React
- **Styling**: Tailwind CSS (for layout and modern aesthetics) & Vanilla CSS
- **Icons**: Lucide React
- **Voice APIs**: Web Speech API (Speech-to-Text) & SpeechSynthesis API (Text-to-Speech)

### Backend (Server-Side)
- **Framework**: FastAPI (Python 3)
- **Database**: SQLite (managed via SQLAlchemy ORM)
- **AI Engine**: Google Generative AI SDK (Gemini 2.5 Flash API)
- **Authentication**: JWT (JSON Web Tokens) via `passlib` & `python-jose`
- **Machine Learning Fallback**: `scikit-learn` (TF-IDF Vectorizer & Cosine Similarity) for offline intent matching.

---

## 3. Directory Structure

```text
apdcl-assistant-v2/
│
├── backend/
│   ├── .env                    # Environment variables (GEMINI_API_KEY)
│   ├── requirements.txt        # Python dependencies
│   ├── run.py                  # Entry point (Uvicorn server)
│   └── app/
│       ├── main.py             # FastAPI application initialization
│       ├── database.py         # SQLite connection setup
│       ├── models.py           # SQLAlchemy database schemas
│       ├── schemas.py          # Pydantic validation models
│       ├── routes/             # API Endpoints
│       │   ├── auth.py         # Login/Register endpoints
│       │   ├── chat.py         # AI messaging endpoints
│       │   ├── services.py     # Bill & Complaint endpoints
│       │   └── admin.py        # Analytics endpoints
│       ├── services/
│       │   ├── rag.py          # AI logic (Gemini API & TF-IDF fallback)
│       │   └── mock_services.py# Mock data generators
│       └── data/
│           └── apdcl_kb.json   # Local Knowledge Base for the AI
│
└── frontend/
    ├── package.json            # Node.js dependencies
    ├── tailwind.config.ts      # Tailwind configuration
    └── src/
        ├── app/
        │   ├── layout.tsx      # Global layout & metadata
        │   ├── page.tsx        # Exact replica of APDCL.org landing page
        │   └── globals.css     # Global styles
        ├── components/
        │   └── ChatWidget.tsx  # The floating "APDCL GENNIE" interface
        └── lib/
            └── api.ts          # Fetch wrappers for connecting to FastAPI
```

---

## 4. Database Schema
The SQLite database (`apdcl.db`) contains the following tables mapped via SQLAlchemy:

1. **User (`users`)**:
   - `id`, `consumer_number` (Unique), `password_hash`, `name`, `mobile`, `email`, `subdivision`, `address`, `category`, `connected_load`, `current_balance`, `last_bill_amount`, `last_bill_date`, `due_date`.
2. **ChatMessage (`chat_messages`)**:
   - `id`, `session_id`, `sender` ("user" or "bot"), `content`, `timestamp`, `intent`, `entities` (JSON String), `language`, `feedback_rating`, `rating_comment`.
3. **Complaint (`complaints`)**:
   - `id`, `complaint_id` (Unique), `consumer_number`, `category`, `description`, `status` ("Pending", "Resolved"), `registration_date`, `resolution_date`, `remarks`.
4. **Outage (`outages`)**:
   - `id`, `subdivision`, `title`, `description`, `start_time`, `end_time`, `status`.

---

## 5. Key Features & Implementation Details

### A. The APDCL.org UI Replica (`page.tsx`)
- The main landing page is an exact visual replica of the official APDCL website.
- It features an unauthenticated public view, allowing any user to browse without logging in.
- Includes the Top Bar (1912 Toll-Free), Logo Header, Navigation Menu, Hero Carousel, and Quick Services Grid.

### B. APDCL GENNIE (The AI Assistant)
- **Location**: Floats in the bottom-right corner of the screen (`ChatWidget.tsx`).
- **Initial State**: Greets users with a grid of actionable buttons (Pay Bill, New Connection, View Bill, etc.).
- **Unauthenticated Handling**: If a user is logged out and asks a general question, the AI answers it. If they ask for personal data (e.g., "What is my bill?"), the AI intercepts it and asks for their 11-digit Consumer Number.
- **RAG Integration**: Before Gemini generates a response, the backend reads `apdcl_kb.json` and the user's billing data (if logged in or if they provided a valid consumer number). This data is secretly injected into Gemini's context window, allowing it to answer with 100% accurate APDCL data.
- **Action Buttons**: The AI is programmed to output Markdown links (e.g., `[Apply for New Connection](/apply)`). The frontend parses these strings and renders them as clickable, styled UI buttons inside the chat.
- **Voice Support**: Users can click the microphone icon to speak (Web Speech API). The AI can also read its responses aloud (SpeechSynthesis API).

### C. Guardrails & Security
- **System Prompt**: Gemini is given strict instructions to *only* answer questions related to APDCL, electricity, and basic greetings. If asked about unrelated topics (e.g., politics, coding), it refuses politely.
- **Database Injection Prevention**: The SQL queries use SQLAlchemy ORM, which automatically sanitizes inputs.

---

## 6. How to Run the Project Locally

### Step 1: Start the Backend (FastAPI)
1. Open a terminal and navigate to the backend folder:
   `cd C:\Users\lenovo\.gemini\antigravity\scratch\apdcl-assistant-v2\backend`
2. Activate the virtual environment (if using Command Prompt/PowerShell):
   `venv\Scripts\activate`
3. Run the server:
   `python run.py`
*(The backend will run on `http://localhost:8000`)*

### Step 2: Start the Frontend (Next.js)
1. Open a new terminal and navigate to the frontend folder:
   `cd C:\Users\lenovo\.gemini\antigravity\scratch\apdcl-assistant-v2\frontend`
2. Run the development server:
   `npm run dev`
*(The frontend will run on `http://localhost:3000`)*

### Step 3: Configure the AI (Gemini API)
1. Create or open the `.env` file in the `backend` folder.
2. Add your Google Gemini API Key:
   `GEMINI_API_KEY=AIzaSy...`
*(If this key is missing or invalid, the backend will gracefully fallback to basic offline keyword matching).*
