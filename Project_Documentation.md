# APDCL Virtual Assistant (v2) - Complete Project Documentation

This document serves as the comprehensive technical specification, architecture overview, feature list, and deployment guide for the **APDCL Virtual Assistant (v2)** project. This is ideal for use in academic or professional project reports.

---

## 1. Project Overview
The project is a modernized, full-stack web application designed to replicate the official Assam Power Distribution Company Limited (APDCL) portal while introducing a cutting-edge AI feature. Its core feature is **"APDCL GENNIE"**, an advanced, floating AI virtual assistant powered by Google Gemini, designed to provide 24/7 automated customer support, bill tracking, complaint registration, and dynamic profile management.

---

## 2. Architecture Stack
The application uses a modern, decoupled architecture:

### Frontend (Client-Side)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript & React
- **Styling**: Tailwind CSS (for layout and modern aesthetics) & Vanilla CSS
- **Icons**: Lucide React
- **Voice APIs**: Web Speech API (Speech-to-Text) & SpeechSynthesis API (Text-to-Speech)
- **Deployment**: Vercel

### Backend (Server-Side)
- **Framework**: FastAPI (Python 3)
- **Database**: SQLite (managed via SQLAlchemy ORM). *Note: Ephemeral when hosted on free cloud tiers.*
- **AI Engine**: Google Generative AI SDK (Gemini 2.5 Flash API)
- **Authentication**: JWT (JSON Web Tokens) via `passlib` & `python-jose`
- **Machine Learning Fallback**: `scikit-learn` (TF-IDF Vectorizer & Cosine Similarity) for offline intent matching.
- **Deployment**: Render.com (via `render.yaml` Infrastructure-as-Code blueprint)

---

## 3. Comprehensive Feature List

### A. The APDCL.org UI Replica (`frontend/src/app/page.tsx`)
- The main landing page is an exact visual replica of the official APDCL website, tailored with premium aesthetics.
- Features an unauthenticated public view, allowing any user to browse without logging in.
- Includes the Top Bar (1912 Toll-Free, WhatsApp Support), Logo Header, Navigation Menu, Hero Carousel, and Quick Services Grid linking directly to official APDCL web portals.

### B. APDCL GENNIE (The AI Assistant - `ChatWidget.tsx`)
**"APDCL GENNIE"** is the flagship feature of this project—a context-aware, highly intelligent floating virtual assistant built into the bottom-right corner of the web interface. It acts as the primary conduit between the user and the APDCL database backend.

#### 1. UI & Visual Aesthetics
- **Design Framework**: Built using Tailwind CSS with deep glassmorphism effects (`backdrop-blur-xl`), animated bouncing entry states, and a premium APDCL-branded color palette (Orange `#f89b1c` and Deep Blue `#115599`).
- **Initial Welcome State**: Before any messages are sent, Gennie automatically greets the user with an intuitive 8-button **"Quick Services Grid"**. This provides instant, one-click access to the most common actions (Pay Bill, New Connection, Update Mobile, 6-Month History, Complaint, Prepaid Recharge, Smart Balance, Call 1912).

#### 2. Advanced Session Management & Security Isolation
- **Logged-in Users (Persistent History)**: If a user logs into the portal, the frontend stores their `apdcl_consumer` number in `localStorage`. The ChatWidget detects this and binds their chat session to `session_user_<consumer_number>`. The FastAPI backend saves all messages under this session ID, allowing the user to seamlessly resume their chat across devices or browser restarts.
- **Guest Users (Ephemeral History)**: If a user is not logged in, the ChatWidget dynamically generates a temporary Math.random() guest session ID on component mount. This ensures complete data isolation. If the guest refreshes the page, their chat history is instantly wiped, protecting their privacy.
- **Graceful Degration**: If a guest asks for sensitive data (like "Show my bill"), the backend AI is programmed to intercept the request and politely ask the user to provide their 11-digit Consumer Number before proceeding.

#### 3. RAG (Retrieval-Augmented Generation) Architecture
The true power of Gennie comes from its custom RAG pipeline (`backend/app/services/rag.py`):
- **Knowledge Base Injection**: A static JSON file (`apdcl_kb.json`) containing APDCL FAQs, tariff rules, and operating procedures is loaded into memory on backend startup.
- **User Context Injection**: When a message hits the `/chat/message` endpoint, the backend looks up the user's live database record (Current Balance, Due Date, Connected Load, Name). 
- **Prompt Engineering**: The backend merges the Knowledge Base, the User Context, and the chat history into an invisible "System Prompt Block". This block is sent to the Google Gemini 2.5 Flash API alongside the user's latest message. 
- **Result**: Gemini responds natively, not as a generic AI, but as an APDCL agent equipped with the exact financial data of the user it is talking to.

#### 4. Specialized AI Data Formatting (6-Month History)
- Users can click the **"6-Month History"** button to request their historical consumption data. 
- **Backend Mocking**: Because the project uses an ephemeral SQLite database for demo purposes, the backend dynamically synthesizes 6 months of highly realistic unit consumption and billing/recharge data based on the user's specific consumer category and current balance.
- **Markdown Tables**: This mock history array is injected into the Gemini context. The Gemini System Prompt explicitly commands the AI to parse this array and output it strictly as a GitHub-flavored Markdown Table. The frontend effortlessly renders this table inside the chat bubble without needing complex React table components.

#### 5. Conversational State Machine (OTP Profile Updation)
The ChatWidget goes beyond standard Q&A by implementing a client-side state machine (`conversationMode: "DEFAULT" | "AWAITING_MOBILE" | "AWAITING_OTP"`) to handle complex multi-step workflows.
- **Trigger**: The user clicks the green "Update Mobile" button.
- **AWAITING_MOBILE**: Gennie temporarily blocks standard AI generation and natively asks the user: *"Please enter your new 10-digit mobile number."* The frontend validates the 10-digit input using Regex.
- **AWAITING_OTP**: The frontend calls the FastAPI `/auth/request-otp` endpoint, which securely generates a mock OTP (e.g., `123456`) and stores it in memory. Gennie then asks the user to provide the OTP.
- **Resolution**: Upon receiving the OTP, the frontend calls `/auth/verify-otp`. The backend validates the code and permanently commits the new mobile number to the SQLite database. Gennie automatically reverts to `"DEFAULT"` mode and resumes normal AI operations.

#### 6. Dynamic UI Markdown Parsing
- The AI is programmed to output web links using strict Markdown syntax (`[Action Name](URL)`). 
- The frontend `ChatWidget.tsx` runs a custom regex parser over every AI message. When it detects a Markdown link, it immediately rips it out of the text and renders it as a large, clickable, orange interactive HTML button below the message text. This drastically improves UX on mobile devices.

#### 7. Accessibility & Voice Support
- **Speech-to-Text (STT)**: The ChatWidget utilizes the browser's native `window.SpeechRecognition` API. Users can click the microphone icon to dictate their queries aloud.
- **Text-to-Speech (TTS)**: The widget leverages the `window.SpeechSynthesis` API. Every AI response features a "Listen" icon, allowing visually impaired users to have their bill details read aloud. It dynamically switches TTS voices based on the detected language (English, Assamese, or Hindi).

### C. The Administrator Dashboard (`frontend/src/app/admin/page.tsx`)
A hidden, secure portal accessible by navigating to `/admin`. It replaces the need for direct SQL shell access (which often requires paid cloud tiers) by providing an elegant GUI:
1. **Overview & Analytics**: Displays real-time KPIs including total conversations, complaint resolution rates, user satisfaction index, daily chat volume (bar chart), and NLP intent distributions.
2. **Consumer Complaints**: A searchable table of all user-lodged complaints. Admins can click "Manage Status" to update the complaint state (e.g., In Progress, Resolved) and leave resolution remarks.
3. **Chat Conversations**: A complete, live log of all conversations had with the AI, including the AI's NLP metadata (detected intents and entities) and user feedback ratings.
4. **Consumers (Users)**: A complete, searchable database GUI of all registered APDCL consumers, displaying their Consumer Number, Name, Mobile, Subdivision, and Current Outstanding Balance.

### D. Resilience & Fallback Logic
- **Rate Limit / Offline Fallback**: If the Google Gemini API key is missing or the free-tier quota is exceeded, the backend gracefully falls back to a custom TF-IDF (scikit-learn) NLP model. This ensures the chatbot remains online, can still answer basic questions, and provides critical links, even without Google's AI.
- **Database Auto-Seeding**: The backend `run.py` script automatically detects if the SQLite database is empty on server startup. If empty, it instantly seeds 5 test users (e.g., Rahul Sharma - 10234567890) and dummy outage data, ensuring deployment environments always have functional test accounts right out of the box.

---

## 4. Database Schema
The SQLite database (`apdcl_assistant.db`) contains the following tables mapped via SQLAlchemy:

1. **User (`users`)**:
   - `id`, `consumer_number` (Unique), `password_hash`, `name`, `mobile`, `email`, `subdivision`, `address`, `category`, `connected_load`, `current_balance`, `last_bill_amount`, `last_bill_date`, `due_date`.
2. **ChatMessage (`chat_messages`)**:
   - `id`, `session_id`, `sender` ("user" or "bot"), `content`, `timestamp`, `intent`, `entities` (JSON String), `language`, `feedback_rating`, `rating_comment`.
3. **Complaint (`complaints`)**:
   - `id`, `complaint_id` (Unique), `consumer_number`, `category`, `description`, `status` ("Registered", "In Progress", "Resolved", "Closed"), `registration_date`, `resolution_date`, `remarks`.
4. **Outage (`outages`)**:
   - `id`, `subdivision`, `title`, `description`, `start_time`, `end_time`, `status`.

---

## 5. Deployment Guide

The project is fully configured for continuous deployment using standard cloud providers.

### A. Deploying the Backend (Render.com)
The backend is deployed using the `render.yaml` Infrastructure-as-Code blueprint.
1. Go to Render.com -> Dashboard -> **New** -> **Blueprint**.
2. Connect your GitHub repository (`APDCL-Gennie`).
3. Render will automatically detect the Python environment, install `requirements.txt`, and run `run.py` (which auto-seeds the database and starts Uvicorn with `reload=False`).
4. Enter your `GEMINI_API_KEY` when prompted.
5. Once deployed, copy the live URL (e.g., `https://apdcl-backend-xxxx.onrender.com`).
*Note: Because Render's free tier uses ephemeral disks, the SQLite database resets on restart. For production persistence, provision a PostgreSQL database and add its URL to the `DATABASE_URL` environment variable.*

### B. Deploying the Frontend (Vercel)
1. Go to Vercel.com -> Dashboard -> **Add New** -> **Project**.
2. Import the `APDCL-Gennie` repository.
3. **Crucial:** Edit the **Root Directory** setting and select `frontend`.
4. Open the **Environment Variables** section and add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your live backend URL from Render + `/api` (e.g., `https://apdcl-backend-xxxx.onrender.com/api`).
5. Click **Deploy**. Vercel will build the Next.js app and provide a live public URL.
