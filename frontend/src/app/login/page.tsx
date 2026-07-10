"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginConsumer, registerConsumer } from "@/lib/api";
import { AlertCircle, KeyRound, User, Phone, Mail, MapPin } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Login form
  const [consumerNumber, setConsumerNumber] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [subdivision, setSubdivision] = useState("Dispur Subdivision");
  const [address, setAddress] = useState("");

  useEffect(() => {
    // If token already exists, redirect to chat
    if (localStorage.getItem("apdcl_token")) {
      router.push("/");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (consumerNumber.length !== 11) {
      setError("Consumer number must be exactly 11 digits.");
      setLoading(false);
      return;
    }
    
    try {
      await loginConsumer(consumerNumber, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Check consumer number and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (consumerNumber.length !== 11) {
      setError("Consumer number must be exactly 11 digits.");
      setLoading(false);
      return;
    }
    
    try {
      await registerConsumer({
        consumer_number: consumerNumber,
        name,
        mobile,
        email: email || null,
        password,
        subdivision,
        address
      });
      // Auto login after registration
      await loginConsumer(consumerNumber, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Top Bar for Authenticity */}
      <div className="fixed top-0 left-0 right-0 bg-[#115599] text-white text-center py-2 text-xs font-semibold shadow-lg z-50 border-b border-[#0b3866]">
        Assam Power Distribution Company Limited - Official Portal
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border-t-4 border-t-[#f89b1c] border-x border-b border-slate-200 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3),0_0_40px_rgba(17,85,153,0.1)] overflow-hidden mt-10 relative">
        
        {/* Header Section */}
        <div className="bg-gradient-to-b from-slate-50 to-white p-8 border-b border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#115599]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-100 p-1 mb-4">
            <img src="/images/apdcl_logo.png" alt="APDCL Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold text-[#115599]">Consumer Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Please sign in or register to access services</p>
        </div>

        <div className="p-8">
          {/* Toggle buttons */}
          <div className="flex border-2 border-slate-100 bg-slate-50 rounded-xl mb-8 p-1.5 shadow-inner">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                isLogin 
                  ? "bg-white text-[#115599] shadow-[0_4px_12px_rgba(17,85,153,0.15)] border border-slate-200" 
                  : "text-slate-500 hover:text-[#115599]"
              }`}
            >
              Consumer Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                !isLogin 
                  ? "bg-white text-[#115599] shadow-[0_4px_12px_rgba(17,85,153,0.15)] border border-slate-200" 
                  : "text-slate-500 hover:text-[#115599]"
              }`}
            >
              New Registration
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLogin ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#115599] mb-1">
                  Consumer Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    maxLength={11}
                    required
                    placeholder="Enter 11-digit Consumer No."
                    value={consumerNumber}
                    onChange={(e) => setConsumerNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.03)] focus:shadow-[0_8px_20px_rgba(248,155,28,0.15)] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.03)] focus:shadow-[0_8px_20px_rgba(248,155,28,0.15)] font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 bg-gradient-to-r from-[#f89b1c] to-[#e08a16] hover:from-[#e08a16] hover:to-[#c77a13] text-white font-bold rounded-xl text-[15px] shadow-[0_8px_20px_rgba(248,155,28,0.4)] transition-all flex items-center justify-center disabled:opacity-50 hover:-translate-y-0.5"
              >
                {loading ? "Authenticating..." : "Login"}
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleRegister} className="space-y-5 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
              <div>
                <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">Consumer Number (11 digits)</label>
                <input
                  type="text"
                  maxLength={11}
                  required
                  placeholder="e.g. 10298765432"
                  value={consumerNumber}
                  onChange={(e) => setConsumerNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm outline-none transition-all duration-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="As per records"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm outline-none transition-all duration-300 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">Mobile No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm outline-none transition-all duration-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    placeholder="Optional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm outline-none transition-all duration-300 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">Subdivision</label>
                <select
                  value={subdivision}
                  onChange={(e) => setSubdivision(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm outline-none transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <option value="Dispur Subdivision">Dispur Subdivision</option>
                  <option value="Kahilipara Subdivision">Kahilipara Subdivision</option>
                  <option value="Ulubari Subdivision">Ulubari Subdivision</option>
                  <option value="Maligaon Subdivision">Maligaon Subdivision</option>
                  <option value="Jalukbari Subdivision">Jalukbari Subdivision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">Address</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Full address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm outline-none transition-all duration-300 shadow-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#115599] mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-[#f89b1c] focus:ring-4 focus:ring-[#f89b1c]/20 rounded-xl text-sm outline-none transition-all duration-300 shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 bg-gradient-to-r from-[#f89b1c] to-[#e08a16] hover:from-[#e08a16] hover:to-[#c77a13] text-white font-bold rounded-xl text-[15px] shadow-[0_8px_20px_rgba(248,155,28,0.4)] transition-all flex items-center justify-center disabled:opacity-50 hover:-translate-y-0.5"
              >
                {loading ? "Registering..." : "Register & Login"}
              </button>
            </form>
          )}
          
          {/* Footer Link */}
          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => router.push("/")}
              className="text-xs text-[#115599] hover:underline font-semibold"
            >
              ← Back to APDCL Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
