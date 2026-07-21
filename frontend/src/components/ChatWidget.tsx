"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  sendMessage, 
  fetchChatHistory, 
  submitChatFeedback, 
  fetchBillDetails,
  lodgeComplaint,
  fetchOutages,
  uploadOCR,
  requestUpdateOTP,
  verifyUpdateOTP,
  Message,
  UserResponse,
  Outage
} from "@/lib/api";
import { 
  Send, Mic, MicOff, Volume2, VolumeX, Paperclip, 
  ThumbsUp, ThumbsDown, LogOut, AlertCircle, FileText, 
  Search, Zap, PlusCircle, Info, ExternalLink, MessageSquare, X
} from "lucide-react";

export default function ChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [session_id, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<"DEFAULT" | "AWAITING_MOBILE" | "AWAITING_OTP">("DEFAULT");
  const [tempMobile, setTempMobile] = useState("");
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  
  // Speech recognition ref
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize session and auth check
  useEffect(() => {
    const consumer = localStorage.getItem("apdcl_consumer");
    
    if (consumer) {
      setCurrentUser(consumer);
      const userSession = `session_user_${consumer}`;
      setSessionId(userSession);
      
      // Load historical chats for this specific user
      fetchChatHistory(userSession)
        .then(res => setMessages(res))
        .catch(err => console.log("Failed to fetch chat history:", err));
    } else {
      // Guest user: Generate new session on refresh, do not save to localStorage
      setCurrentUser(null);
      const guestSession = `guest-${Math.random().toString(36).substring(2, 15)}`;
      setSessionId(guestSession);
      setMessages([]);
    }

    // Check Speech Recognition capability
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN"; 

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(prev => prev + (prev ? " " : "") + transcript);
        };
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const startMobileUpdateFlow = () => {
    if (!currentUser) {
      setMessages(prev => [...prev, { id: Date.now(), sender: "bot", content: "Please login first to update your mobile number. [Login Now](/login)", timestamp: new Date().toISOString(), language }]);
      return;
    }
    setConversationMode("AWAITING_MOBILE");
    setMessages(prev => [...prev, { id: Date.now(), sender: "bot", content: "Let's update your mobile number. Please enter your new 10-digit mobile number.", timestamp: new Date().toISOString(), language }]);
  };

  const requestHistory = () => {
    handleSend(undefined, "Please show my last 6 months of unit consumption and billing history in a table.");
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputValue;
    if (!textToSend.trim()) return;
    
    // Check if user wants to cancel out of a flow
    if ((conversationMode !== "DEFAULT") && textToSend.toLowerCase() === "cancel") {
       setConversationMode("DEFAULT");
       setTempMobile("");
       setMessages(prev => [...prev, { id: Date.now(), sender: "user", content: textToSend, timestamp: new Date().toISOString(), language }, { id: Date.now() + 1, sender: "bot", content: "Operation cancelled.", timestamp: new Date().toISOString(), language }]);
       if (!customText) setInputValue("");
       return;
    }
    
    const localUserMsg: Message = {
      id: Date.now(),
      sender: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
      language
    };
    
    setMessages(prev => [...prev, localUserMsg]);
    if (!customText) setInputValue("");
    
    if (conversationMode === "AWAITING_MOBILE") {
      const stripped = textToSend.replace(/\D/g, "");
      if (stripped.length !== 10) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", content: "Invalid mobile number. Please enter a valid 10-digit number, or type 'cancel'.", timestamp: new Date().toISOString(), language }]);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("apdcl_token") || "";
        await requestUpdateOTP(stripped, token);
        setTempMobile(stripped);
        setConversationMode("AWAITING_OTP");
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", content: `An OTP has been sent to ${stripped}. (Demo OTP: 123456). Please enter the 6-digit OTP below.`, timestamp: new Date().toISOString(), language }]);
      } catch (err: any) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", content: err.message, timestamp: new Date().toISOString(), language }]);
        setConversationMode("DEFAULT");
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (conversationMode === "AWAITING_OTP") {
      setLoading(true);
      try {
        const token = localStorage.getItem("apdcl_token") || "";
        await verifyUpdateOTP(tempMobile, textToSend.trim(), token);
        setConversationMode("DEFAULT");
        setTempMobile("");
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", content: "Success! Your mobile number has been updated successfully.", timestamp: new Date().toISOString(), language }]);
      } catch (err: any) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", content: "Invalid OTP. Please try again or type 'cancel'.", timestamp: new Date().toISOString(), language }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    
    try {
      const response = await sendMessage(textToSend, session_id, language);
      setMessages(prev => [...prev, response]);
      
      if (ttsEnabled) {
        speakText(response.content, response.language);
      }
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: Date.now() + 1,
        sender: "bot",
        content: "Connection error. Please try again.",
        timestamp: new Date().toISOString(),
        language
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string, msgLang: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_\[\]()\-]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (msgLang === "hi") utterance.lang = "hi-IN";
      else if (msgLang === "as") utterance.lang = "as-IN"; 
      else utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      if (language === "hi") recognitionRef.current.lang = "hi-IN";
      else if (language === "as") recognitionRef.current.lang = "bn-IN"; 
      else recognitionRef.current.lang = "en-IN";
      recognitionRef.current.start();
    }
  };

  const handleFeedback = async (msgId: number, score: number) => {
    try {
      const updated = await submitChatFeedback(msgId, score);
      setMessages(prev => prev.map(m => m.id === msgId ? updated : m));
    } catch (err) {
      console.error("Failed feedback logging:", err);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4)] transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen ? "bg-slate-800 text-white hover:bg-slate-700 hover:rotate-90 shadow-[0_10px_30px_rgba(30,41,59,0.6)]" : "bg-gradient-to-tr from-[#f89b1c] to-[#e08a16] text-white hover:scale-110 shadow-[0_15px_35px_rgba(248,155,28,0.6)] hover:shadow-[0_20px_45px_rgba(248,155,28,0.8)] animate-bounce hover:animate-none"
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] bg-white border border-slate-200/60 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4),0_0_40px_rgba(17,85,153,0.15)] flex flex-col overflow-hidden z-50 animate-fade-in font-sans transform origin-bottom-right transition-all">
          
          {/* Header */}
          <header className="p-4 bg-gradient-to-r from-[#115599] to-[#0d4073] border-b border-[#0b3866] flex items-center justify-between shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200 p-0.5 shrink-0">
                <img src="/images/apdcl_logo.png" alt="APDCL Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">APDCL GENNIE</h3>
                <p className="text-[10px] text-slate-400">AI Virtual Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-800 rounded px-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${language === "en" ? "bg-orange-500 text-white" : "text-slate-400"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("as")}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${language === "as" ? "bg-orange-500 text-white" : "text-slate-400"}`}
              >
                AS
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${language === "hi" ? "bg-orange-500 text-white" : "text-slate-400"}`}
              >
                HI
              </button>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin bg-slate-50/80 backdrop-blur-sm">
            {messages.length === 0 && (
              <div className="text-center mt-8 mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_8px_20px_rgba(17,85,153,0.15)] border-2 border-slate-100 p-1">
                  <img src="/images/apdcl_logo.png" alt="APDCL Logo" className="w-full h-full object-contain" />
                </div>
                <h4 className="text-lg font-extrabold text-[#115599] mb-1">Hi, I'm Gennie!</h4>
                <p className="text-xs text-slate-500 mb-6 px-4">
                  I can help you check bills, report outages, and answer APDCL queries.
                </p>
                <div className="space-y-2 px-4 w-full">
                  <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest text-center">Quick Services</p>
                  <div className="grid grid-cols-2 gap-2">
                    <a href="https://www.apdcl.org/website/PayBill" target="_blank" rel="noopener noreferrer" className="text-[10px] p-2 bg-[#0d84c6] text-white rounded hover:bg-[#0b6b9e] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">Pay Bill</a>
                    <a href="https://www.apdcl.org/website/ApplyNewConn" target="_blank" rel="noopener noreferrer" className="text-[10px] p-2 bg-[#f89b1c] text-white rounded hover:bg-[#e08a16] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">New Connection</a>
                    <a href="https://www.apdcl.org/website/ViewBill" target="_blank" rel="noopener noreferrer" className="text-[10px] p-2 bg-[#0d84c6] text-white rounded hover:bg-[#0b6b9e] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">View Bill</a>
                    <button onClick={(e) => { e.preventDefault(); requestHistory(); }} className="text-[10px] p-2 bg-[#115599] text-white rounded hover:bg-[#0b437a] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline cursor-pointer">6-Month History</button>
                    <a href="https://www.bijuleebandhu.com/complaints" target="_blank" rel="noopener noreferrer" className="text-[10px] p-2 bg-[#f89b1c] text-white rounded hover:bg-[#e08a16] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">Complaint</a>
                    <a href="https://www.apdcl.org/website/RechargePrepaid" target="_blank" rel="noopener noreferrer" className="text-[10px] p-2 bg-[#0d84c6] text-white rounded hover:bg-[#0b6b9e] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">Prepaid Recharge</a>
                    <a href="https://www.apdcl.org/website/SmartPrepaidBalance" target="_blank" rel="noopener noreferrer" className="text-[10px] p-2 bg-[#f89b1c] text-white rounded hover:bg-[#e08a16] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">Smart Balance</a>
                    <button onClick={(e) => { e.preventDefault(); startMobileUpdateFlow(); }} className="text-[10px] p-2 bg-[#25D366] text-white rounded hover:bg-[#1da851] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline cursor-pointer">Update Mobile</button>
                    <a href="tel:1912" className="text-[10px] p-2 bg-[#115599] text-white rounded hover:bg-[#0b437a] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">Call 1912</a>
                    <a href="https://wa.me/917575999666" target="_blank" rel="noopener noreferrer" className="text-[10px] p-2 bg-[#25D366] text-white rounded hover:bg-[#1da851] flex items-center justify-center text-center transition-colors shadow-sm font-bold no-underline">WhatsApp Help</a>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex max-w-[88%] ${msg.sender === "user" ? "ml-auto" : "mr-auto"}`}>
                <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-[#115599] to-[#0b437a] text-white rounded-br-sm border-2 border-[#083057]"
                    : "bg-gradient-to-br from-[#f0f7ff] to-[#e0efff] text-slate-800 border-2 border-[#99caff] rounded-bl-sm shadow-[0_4px_15px_rgba(17,85,153,0.05)]"
                }`}>
                  <div className="whitespace-pre-wrap">
                    {/* Parse markdown links into action buttons */}
                    {msg.content.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
                      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                      if (match) {
                        return (
                          <div key={i} className="mt-3">
                            <a 
                              href={match[2]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block w-full text-center px-4 py-2.5 mt-1 bg-gradient-to-r from-[#f89b1c] to-[#e08a16] text-white rounded-xl font-bold hover:shadow-[0_5px_15px_rgba(248,155,28,0.4)] transition-all transform hover:-translate-y-0.5"
                            >
                              {match[1]}
                            </a>
                          </div>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                  
                  {msg.sender === "bot" && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 text-slate-400">
                      <button onClick={() => speakText(msg.content, msg.language)} className="hover:text-white" title="Listen">
                        <Volume2 className="w-3 h-3" />
                      </button>
                      {msg.feedback_rating === undefined && (
                        <div className="flex gap-2">
                          <button onClick={() => handleFeedback(msg.id, 5)} className="hover:text-emerald-400"><ThumbsUp className="w-3 h-3" /></button>
                          <button onClick={() => handleFeedback(msg.id, 1)} className="hover:text-rose-400"><ThumbsDown className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex max-w-[85%] mr-auto">
                <div className="p-3 bg-slate-800 rounded-2xl rounded-bl-none text-slate-400 text-xs flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/95 backdrop-blur-xl border-t-2 border-slate-100 shadow-[0_-20px_40px_-5px_rgba(0,0,0,0.15)] relative z-20 rounded-b-3xl">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask Gennie..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-full px-5 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-[0_10px_25px_rgba(0,0,0,0.15)] outline-none focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/30 focus:shadow-[0_15px_35px_rgba(248,155,28,0.25)] transition-all duration-300 font-medium"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl transition-all ${isRecording ? "bg-rose-950 text-rose-400" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="p-2 bg-[#f89b1c] hover:bg-[#e08a16] text-white rounded-xl disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
