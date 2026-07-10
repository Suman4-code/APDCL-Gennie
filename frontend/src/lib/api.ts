const BASE_URL = "http://localhost:8000/api";

export interface Message {
  id: number;
  sender: "user" | "bot";
  content: string;
  timestamp: string;
  intent?: string;
  entities?: string; // JSON string
  language: string;
  feedback_rating?: number;
  rating_comment?: string;
}

export interface UserResponse {
  consumer_number: string;
  name: string;
  mobile: string;
  email: string | null;
  subdivision: string;
  address: string;
  category: string;
  connected_load: number;
  current_balance: number;
  last_bill_amount: number;
  last_bill_date: string | null;
  due_date: string | null;
}

export interface Complaint {
  complaint_id: string;
  consumer_number: string;
  category: string;
  description: string;
  status: string;
  registration_date: string;
  resolution_date: string | null;
  remarks: string | null;
}

export interface Outage {
  id: number;
  subdivision: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface AnalyticsDashboard {
  total_chats: number;
  total_complaints: number;
  resolved_complaints: number;
  pending_complaints: number;
  user_satisfaction_rate: number;
  complaint_categories: { category: string; count: number }[];
  intent_distribution: Record<string, number>;
  daily_volume: { date: string; chats: number }[];
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("apdcl_token");
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errText = await response.text();
    let message = "Request failed";
    try {
      const parsed = JSON.parse(errText);
      message = parsed.detail || message;
    } catch {
      message = errText || message;
    }
    throw new Error(message);
  }
  
  return response.json();
}

// Authentication
export async function loginConsumer(consumer_number: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_number, password }),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Login failed");
  }
  
  const data = await response.json();
  localStorage.setItem("apdcl_token", data.access_token);
  localStorage.setItem("apdcl_consumer", consumer_number);
  return data;
}

export async function registerConsumer(userData: any) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Registration failed");
  }
  
  return response.json();
}

export async function fetchMe(): Promise<UserResponse> {
  return fetchWithAuth("/auth/me");
}

// Chat API
export async function sendMessage(content: string, session_id: string, language: string = "en"): Promise<Message> {
  return fetchWithAuth("/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, session_id, language }),
  });
}

export async function fetchChatHistory(session_id: string): Promise<Message[]> {
  const response = await fetch(`${BASE_URL}/chat/history/${session_id}`);
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
}

export async function submitChatFeedback(message_id: number, rating: number, comment?: string): Promise<Message> {
  const response = await fetch(`${BASE_URL}/chat/feedback/${message_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback_rating: rating, rating_comment: comment }),
  });
  if (!response.ok) throw new Error("Failed to submit feedback");
  return response.json();
}

// APDCL Services API
export async function fetchBillDetails(consumer_number: string): Promise<UserResponse> {
  const response = await fetch(`${BASE_URL}/services/bill/${consumer_number}`);
  if (!response.ok) throw new Error("Failed to fetch bill details");
  return response.json();
}

export async function lodgeComplaint(category: string, description: string, consumer_number: string): Promise<Complaint> {
  const formData = new FormData();
  formData.append("category", category);
  formData.append("description", description);
  formData.append("consumer_number", consumer_number);
  
  const response = await fetch(`${BASE_URL}/services/complaint`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) throw new Error("Failed to lodge complaint");
  return response.json();
}

export async function trackComplaint(complaint_id: string): Promise<Complaint> {
  const response = await fetch(`${BASE_URL}/services/complaint/${complaint_id}`);
  if (!response.ok) throw new Error("Complaint not found");
  return response.json();
}

export async function fetchOutages(subdivision?: string): Promise<Outage[]> {
  const url = subdivision 
    ? `${BASE_URL}/services/outages?subdivision=${encodeURIComponent(subdivision)}` 
    : `${BASE_URL}/services/outages`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch outages");
  return response.json();
}

export async function uploadOCR(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${BASE_URL}/services/ocr`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "OCR upload failed");
  }
  return response.json();
}

// Admin API
export async function fetchAdminAnalytics(): Promise<AnalyticsDashboard> {
  const response = await fetch(`${BASE_URL}/admin/analytics`);
  if (!response.ok) throw new Error("Failed to fetch admin stats");
  return response.json();
}

export async function fetchAllComplaints(): Promise<Complaint[]> {
  const response = await fetch(`${BASE_URL}/admin/complaints`);
  if (!response.ok) throw new Error("Failed to fetch complaints");
  return response.json();
}

export async function updateComplaintStatus(complaint_id: string, status: string, remarks: string) {
  const response = await fetch(`${BASE_URL}/admin/complaint/${complaint_id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, remarks }),
  });
  if (!response.ok) throw new Error("Failed to update status");
  return response.json();
}

export async function fetchAdminChatLogs(): Promise<Message[]> {
  const response = await fetch(`${BASE_URL}/admin/chats`);
  if (!response.ok) throw new Error("Failed to fetch chat logs");
  return response.json();
}
