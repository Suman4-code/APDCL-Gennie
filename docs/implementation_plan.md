# Add 6-Month Billing & Consumption History

The goal is to allow users to easily view their last 6 months of unit consumption and bill/recharge amounts directly within APDCL Gennie. We will leverage our RAG (Retrieval-Augmented Generation) architecture to dynamically generate and format this data without requiring complex frontend table components.

## Proposed Changes

### 1. Backend Data Generation
We will dynamically mock realistic 6-month historical data so that we don't need to rebuild the database schema for this prototype.
#### [MODIFY] `backend/app/services/mock_services.py`
- Add a new helper function `get_mock_history(consumer_number, category, current_balance)` that generates an array of the last 6 months.
- For Prepaid consumers (if the category indicates prepaid, or we just randomly assign it), it will generate `month`, `unit_consumption`, and `recharge_amount`.
- For Postpaid consumers, it will generate `month`, `unit_consumption`, and `bill_amount`.

### 2. Context Injection
#### [MODIFY] `backend/app/routes/chat.py`
- When building the `user_data` dictionary to pass to the Gemini AI, we will call `get_mock_history()` and attach the `billing_history` array to the context.

#### [MODIFY] `backend/app/services/rag.py`
- Update the Gemini `system_instruction` prompt. We will instruct Gemini that if the user asks for historical data (e.g., "6 month history"), it MUST read the `billing_history` array from the injected context and format it as a clean, readable **Markdown Table**.

### 3. Frontend Chat UI
#### [MODIFY] `frontend/src/components/ChatWidget.tsx`
- Add a new **"6 Month History"** button to the Quick Services grid.
- When clicked, this button will automatically send a hidden prompt to Gennie: *"Please show my last 6 months of unit consumption and billing/recharge history in a table."*
- If the user is logged out, Gennie will gracefully ask for their 11-digit consumer number (as per existing logic). Once provided, Gennie will display the table!

## User Review Required

> [!TIP]
> This approach uses the power of AI to dynamically generate and render the UI (via Markdown tables) natively inside the chat bubble, rather than building a rigid React table. This keeps the experience conversational and modern. 
> Since we don't have historical data in the SQLite database, the 6 months of data will be mocked realistically based on the consumer number.

Click **Proceed** if you approve of this approach!
