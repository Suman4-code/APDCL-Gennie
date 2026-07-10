"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  fetchAdminAnalytics, 
  fetchAllComplaints, 
  fetchAdminChatLogs, 
  updateComplaintStatus,
  fetchAllUsers,
  Complaint,
  Message,
  AnalyticsDashboard,
  UserResponse
} from "@/lib/api";
import { 
  BarChart3, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Heart, 
  Clock, 
  ChevronRight, 
  ShieldAlert, 
  ArrowLeft,
  RefreshCw,
  Search,
  Settings
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [chats, setChats] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "chats" | "users">("overview");
  
  // Selected complaint for status update modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState("In Progress");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const [analyticsData, complaintsData, chatsData, usersData] = await Promise.all([
        fetchAdminAnalytics(),
        fetchAllComplaints(),
        fetchAdminChatLogs(),
        fetchAllUsers()
      ]);
      setAnalytics(analyticsData);
      setComplaints(complaintsData);
      setChats(chatsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);
    try {
      await updateComplaintStatus(selectedComplaint.complaint_id, newStatus, adminRemarks);
      // Reload complaints & stats
      await loadData();
      setSelectedComplaint(null);
      setAdminRemarks("");
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => 
    c.complaint_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.consumer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter chats
  const filteredChats = chats.filter(c => 
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.intent && c.intent.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.entities && c.entities.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter users
  const filteredUsers = users.filter(u => 
    u.consumer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">Loading APDCL Administrator Panel...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-8 relative">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Admin Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 z-10 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/")}
            className="p-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 rounded-xl transition-all"
            title="Return to Chat"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md">
                SECURE PORTAL
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              APDCL Operations & Analytics Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-6">
          <button
            onClick={() => { setActiveTab("overview"); setSearchQuery(""); }}
            className={`pb-3.5 text-sm font-semibold relative transition-all cursor-pointer ${
              activeTab === "overview" ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview & Analytics
            {activeTab === "overview" && (
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-indigo-500"></div>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("complaints"); setSearchQuery(""); }}
            className={`pb-3.5 text-sm font-semibold relative transition-all cursor-pointer ${
              activeTab === "complaints" ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Consumer Complaints
            {activeTab === "complaints" && (
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-indigo-500"></div>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("chats"); setSearchQuery(""); }}
            className={`pb-3.5 text-sm font-semibold relative transition-all cursor-pointer ${
              activeTab === "chats" ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Chat Conversations
            {activeTab === "chats" && (
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-indigo-500"></div>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
            className={`pb-3.5 text-sm font-semibold relative transition-all cursor-pointer ${
              activeTab === "users" ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Consumers (Users)
            {activeTab === "users" && (
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-indigo-500"></div>
            )}
          </button>
        </div>

        {/* --- Tab 1: OVERVIEW & ANALYTICS --- */}
        {activeTab === "overview" && analytics && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    Total Conversations
                  </span>
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white">{analytics.total_chats}</div>
                <div className="text-[10px] text-indigo-400 mt-1">Chatbot NLP Interactions</div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    Logged Complaints
                  </span>
                  <AlertCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{analytics.total_complaints}</div>
                <div className="text-[10px] text-cyan-400 mt-1">
                  {analytics.pending_complaints} Pending / {analytics.resolved_complaints} Resolved
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    Complaint Resolve Rate
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {analytics.total_complaints > 0 
                    ? `${Math.round((analytics.resolved_complaints / analytics.total_complaints) * 100)}%`
                    : "100%"
                  }
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">Percentage of complaints closed</div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    Satisfaction Index
                  </span>
                  <Heart className="w-5 h-5 text-rose-400 fill-rose-500/10" />
                </div>
                <div className="text-2xl font-bold text-white">{analytics.user_satisfaction_rate}%</div>
                <div className="text-[10px] text-rose-400 mt-1">User thumbs up rating</div>
              </div>
            </div>

            {/* Charts & Categorizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Inquiries Volume Chart */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Daily Conversation Inquiries (Last 7 Days)
                </h3>
                <div className="h-60 flex items-end gap-3 px-2 border-b border-l border-slate-800 pb-2.5 pt-4">
                  {analytics.daily_volume.map((item, idx) => {
                    const maxCount = Math.max(...analytics.daily_volume.map(v => v.chats), 5);
                    const pctHeight = (item.chats / maxCount) * 80 + 10; // min 10% for styling
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="text-[10px] text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.chats}
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 hover:from-indigo-500 hover:to-cyan-300 rounded-t-lg transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                          style={{ height: `${pctHeight}%` }}
                        ></div>
                        <span className="text-[10px] text-slate-500 mt-1 transform rotate-0 md:rotate-0">
                          {item.date.split("-")[2]}/{item.date.split("-")[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Categorization & Intent Distribution */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    Complaints Category Distribution
                  </h3>
                  <div className="space-y-3">
                    {analytics.complaint_categories.map((cat, idx) => {
                      const totalC = analytics.total_complaints || 1;
                      const cPct = Math.round((cat.count / totalC) * 100);
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                            <span>{cat.category}</span>
                            <span>{cat.count} ({cPct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className="h-full bg-cyan-400 rounded-full" 
                              style={{ width: `${cPct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    {analytics.complaint_categories.length === 0 && (
                      <div className="text-center text-xs text-slate-500 py-6">No complaints registered yet.</div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 mt-6 pt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    NLP Intent Recognition Distribution
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(analytics.intent_distribution).map(([intent, count], idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-950 border border-slate-800 rounded-lg text-slate-400 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {intent}: <strong className="text-slate-200">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab 2: CONSUMER COMPLAINTS --- */}
        {activeTab === "complaints" && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
              <h3 className="text-sm font-semibold text-white">Active Complaint Escalations</h3>
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search Consumer ID or Complaint ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Complaint ID</th>
                    <th className="py-3 px-4">Consumer No</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date Registered</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredComplaints.map((comp) => (
                    <tr key={comp.complaint_id} className="hover:bg-slate-900/30 transition-all text-slate-300">
                      <td className="py-3.5 px-4 font-bold text-cyan-400">{comp.complaint_id}</td>
                      <td className="py-3.5 px-4 font-mono">{comp.consumer_number}</td>
                      <td className="py-3.5 px-4">{comp.category}</td>
                      <td className="py-3.5 px-4">
                        {new Date(comp.registration_date).toLocaleDateString()} {new Date(comp.registration_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          comp.status === "Registered" ? "bg-blue-500/10 text-blue-400 border-blue-500/25" :
                          comp.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/25" :
                          comp.status === "Resolved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/25"
                        }`}>
                          {comp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setSelectedComplaint(comp);
                            setNewStatus(comp.status);
                            setAdminRemarks(comp.remarks || "");
                          }}
                          className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all cursor-pointer font-semibold text-[11px]"
                        >
                          Manage Status
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No complaints match your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab 3: CHAT CONVERSATIONS --- */}
        {activeTab === "chats" && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
              <h3 className="text-sm font-semibold text-white">Live Conversation Logs & NLP Metadata</h3>
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search Chat Message or Intent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredChats.map((chat) => (
                <div key={chat.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-850/80 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        chat.sender === "user" ? "bg-slate-800 text-slate-300" : "bg-indigo-950/60 text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {chat.sender}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">Session: {chat.id}</span>
                    </div>
                    
                    <span className="text-[10px] text-slate-500">
                      {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 whitespace-pre-wrap font-medium">{chat.content}</p>

                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-850/40 text-[10px]">
                    {chat.intent && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                        Intent: <strong className="text-slate-250">{chat.intent}</strong>
                      </span>
                    )}
                    {chat.language && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 uppercase">
                        Lang: <strong className="text-slate-250">{chat.language}</strong>
                      </span>
                    )}
                    {chat.entities && chat.entities !== "{}" && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-cyan-400">
                        Entities: <strong className="font-mono text-cyan-300">{chat.entities}</strong>
                      </span>
                    )}
                    {chat.feedback_rating !== undefined && chat.feedback_rating !== null && (
                      <span className={`px-2 py-0.5 border rounded font-semibold ${
                        chat.feedback_rating >= 4 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}>
                        Rating: {chat.feedback_rating === 5 ? "Thumbs Up" : "Thumbs Down"} 
                        {chat.rating_comment && ` (${chat.rating_comment})`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredChats.length === 0 && (
                <div className="text-center text-xs text-slate-500 py-10">No chats found.</div>
              )}
            </div>
          </div>
        )}

        {/* --- Tab 4: CONSUMERS --- */}
        {activeTab === "users" && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
              <h3 className="text-sm font-semibold text-white">Registered Consumer Database</h3>
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search Name or Consumer No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Consumer Number</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Subdivision</th>
                    <th className="py-3 px-4 text-right">Current Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => (
                    <tr key={user.consumer_number} className="hover:bg-slate-900/30 transition-all text-slate-300">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{user.consumer_number}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{user.name}</td>
                      <td className="py-3.5 px-4 text-slate-400">{user.mobile}</td>
                      <td className="py-3.5 px-4 text-slate-400">{user.subdivision}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-400 font-bold">
                        ₹{user.current_balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No consumers match your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- Status Update Modal Dialog --- */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Update Complaint Status</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Complaint ID: {selectedComplaint.complaint_id}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Registered">Registered</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Add Admin Resolution Remarks
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Enter technician details, restoration details, or billing adjustment notes..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-800 bg-slate-950 text-slate-450 hover:bg-slate-900 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 cursor-pointer disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Status Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
