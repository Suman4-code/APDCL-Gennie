"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Phone, MessageCircle, Mail, UserCircle, 
  CreditCard, BatteryCharging, FileText, Zap, 
  Settings, UserCheck, Calculator, AlertTriangle, 
  Search, Info, Shield, HelpCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import ChatWidget from "@/components/ChatWidget";
import Link from "next/link";

const BANNERS = [
  "/images/banner1.jpg",
  "/images/banner2.jpg",
  "/images/banner3.jpg",
  "/images/banner4.jpg",
  "/images/banner5.jpg",
  "/images/banner6.jpg",
  "/images/banner7.jpg",
  "/images/banner8.jpg"
];

export default function LandingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    // Check if user is logged in
    const consumer = localStorage.getItem("apdcl_consumer");
    if (consumer) {
      setCurrentUser(consumer);
    }
    
    // Auto-advance carousel
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("apdcl_token");
    localStorage.removeItem("apdcl_consumer");
    setCurrentUser(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* 1. Top Bar (Blue) */}
      <div className="bg-[#115599] text-white text-[11px] py-1.5 px-4 hidden md:block">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center font-semibold">
          <div className="flex items-center gap-4">
            <a href="tel:1912" className="flex items-center gap-1.5 hover:text-[#f89b1c] transition-colors no-underline text-white"><Phone className="w-3 h-3" /> Toll Free: 1912</a>
            <span className="text-white/40">|</span>
            <a href="https://wa.me/917575999666" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#f89b1c] transition-colors no-underline text-white"><MessageCircle className="w-3 h-3" /> Whatsapp: 7575999666</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="cursor-pointer hover:underline">Screen Reader Access</span>
            <span className="text-white/40">|</span>
            <span className="cursor-pointer font-bold tracking-widest">A- A A+</span>
            <span className="text-white/40">|</span>
            <select className="bg-transparent border-none outline-none cursor-pointer text-white">
              <option className="text-black">English</option>
              <option className="text-black">অসমীয়া</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Logo Bar (White) */}
      <div className="bg-white py-4 px-4 shadow-sm relative z-20">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 shadow-lg border border-slate-100 p-1">
              <img src="/images/apdcl_logo.png" alt="APDCL Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-[22px] text-[#115599] tracking-tight leading-tight uppercase">
                Assam Power Distribution<br/>Company Limited
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600 font-semibold border-r border-slate-200 pr-6">
              <Mail className="w-5 h-5 text-[#115599]" />
              support@apdcl.org
            </div>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Welcome,</p>
                  <p className="text-sm font-bold text-[#115599]">{currentUser}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded shadow-sm border border-slate-300 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#f89b1c] hover:bg-[#e08a16] text-white text-sm font-bold rounded shadow-md transition-colors">
                  <UserCircle className="w-5 h-5" />
                  Consumer Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. Navigation Bar (Orange) */}
      <nav className="bg-[#f89b1c] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-[1200px] mx-auto px-4 hidden md:flex items-center gap-6 text-[13px] font-bold uppercase">
          <a href="#" className="py-3 px-2 border-b-2 border-white hover:text-white transition-colors text-white">Home</a>
          <a href="#" className="py-3 px-2 border-b-2 border-transparent hover:border-white/50 text-white/90 hover:text-white transition-colors">About Us</a>
          <a href="#" className="py-3 px-2 border-b-2 border-transparent hover:border-white/50 text-white/90 hover:text-white transition-colors">Consumer Information</a>
          <a href="#" className="py-3 px-2 border-b-2 border-transparent hover:border-white/50 text-white/90 hover:text-white transition-colors">Projects</a>
          <a href="#" className="py-3 px-2 border-b-2 border-transparent hover:border-white/50 text-white/90 hover:text-white transition-colors">Solar Rooftop</a>
          <a href="#" className="py-3 px-2 border-b-2 border-transparent hover:border-white/50 text-white/90 hover:text-white transition-colors">Notifications</a>
          <a href="#" className="py-3 px-2 border-b-2 border-transparent hover:border-white/50 text-white/90 hover:text-white transition-colors">Contact Us</a>
        </div>
      </nav>

      {/* 4. Hero / Carousel Area */}
      <div className="w-full relative h-[150px] sm:h-[250px] md:h-[400px] bg-slate-900 overflow-hidden group">
        
        {/* Banner Images */}
        <div 
          className="flex transition-transform duration-1000 ease-in-out h-full w-full"
          style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
        >
          {BANNERS.map((banner, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 relative">
              <img 
                src={banner} 
                alt={`APDCL Banner ${idx + 1}`} 
                className="w-full h-full object-cover md:object-fill"
              />
            </div>
          ))}
        </div>

        {/* Carousel Controls */}
        <button 
          onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBannerIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentBannerIndex === idx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 5. Quick Links Grid */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-12">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-[#115599] uppercase tracking-wide">Our Services</h3>
          <div className="w-16 h-1 bg-[#f89b1c] mx-auto mt-3"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: CreditCard, title: "Pay Bill", color: "text-[#115599]", link: "https://www.apdcl.org/website/PayBill" },
            { icon: BatteryCharging, title: "Prepaid Recharge", color: "text-emerald-600", link: "https://www.apdcl.org/website/RechargePrepaid" },
            { icon: FileText, title: "View Bill", color: "text-[#115599]", link: "https://www.apdcl.org/website/ViewBill" },
            { icon: Zap, title: "Apply New Connection", color: "text-[#f89b1c]", link: "https://www.apdcl.org/website/ApplyNewConn" },
            { icon: Settings, title: "Load Change", color: "text-[#115599]", link: "#" },
            { icon: UserCheck, title: "Name Change", color: "text-[#115599]", link: "#" },
            { icon: Calculator, title: "Submit Meter Reading", color: "text-purple-600", link: "#" },
            { icon: AlertTriangle, title: "Lodge Complaint", color: "text-rose-600", link: "https://www.bijuleebandhu.com/complaints" }
          ].map((item, idx) => (
            <a key={idx} href={item.link} target={item.link !== "#" ? "_blank" : "_self"} rel={item.link !== "#" ? "noopener noreferrer" : ""} className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center shadow hover:shadow-lg transition-all cursor-pointer group no-underline">
              <div className={`w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${item.color}`}>
                <item.icon className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 group-hover:text-[#115599] transition-colors">{item.title}</h4>
            </a>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-slate-200 py-12">
        <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-[#f89b1c]">
            <h4 className="font-bold text-[#115599] flex items-center gap-2 mb-4"><Info className="w-5 h-5"/> Important Notice</h4>
            <ul className="text-sm text-slate-600 space-y-3">
              <li className="border-b border-slate-100 pb-2 hover:text-[#f89b1c] cursor-pointer">Beware of fraudulent SMS regarding bill payment.</li>
              <li className="border-b border-slate-100 pb-2 hover:text-[#f89b1c] cursor-pointer">Mandatory KYC update for all consumers.</li>
              <li className="hover:text-[#f89b1c] cursor-pointer">Smart Meter roll-out schedule announced.</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-[#115599]">
            <h4 className="font-bold text-[#115599] flex items-center gap-2 mb-4"><Search className="w-5 h-5"/> Quick Enquiries</h4>
            <ul className="text-sm text-slate-600 space-y-3">
              <li className="border-b border-slate-100 pb-2 hover:text-[#115599] cursor-pointer">Search Application Status</li>
              <li className="border-b border-slate-100 pb-2 hover:text-[#115599] cursor-pointer">Track Complaint Status</li>
              <li className="hover:text-[#115599] cursor-pointer">Search Payment Receipt</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-emerald-500">
            <h4 className="font-bold text-[#115599] flex items-center gap-2 mb-4"><Shield className="w-5 h-5"/> Consumer Awareness</h4>
            <div className="text-sm text-slate-600 leading-relaxed">
              Do not share your OTP, Debit/Credit Card details, or net banking passwords with anyone over a phone call. APDCL never asks for confidential banking information.
            </div>
          </div>
        </div>
      </div>

      {/* 6. Footer */}
      <footer className="bg-[#0b3866] text-white pt-12 pb-6">
        <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h5 className="font-bold text-lg mb-4 text-[#f89b1c]">APDCL</h5>
            <p className="text-sm text-white/80 leading-relaxed">
              Assam Power Distribution Company Limited.<br/>
              Bijulee Bhawan, Paltanbazar,<br/>
              Guwahati-781001, Assam, India.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 text-[#f89b1c]">Quick Links</h5>
            <ul className="text-sm text-white/80 space-y-2">
              <li className="hover:text-white cursor-pointer"><a href="https://www.apdcl.org/website/PayBill" target="_blank" rel="noopener noreferrer" className="no-underline text-inherit">Online Bill Payment</a></li>
              <li className="hover:text-white cursor-pointer">Tenders</li>
              <li className="hover:text-white cursor-pointer">Careers</li>
              <li className="hover:text-white cursor-pointer">RTI</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 text-[#f89b1c]">Policies</h5>
            <ul className="text-sm text-white/80 space-y-2">
              <li className="hover:text-white cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer">Terms & Conditions</li>
              <li className="hover:text-white cursor-pointer">Refund Policy</li>
              <li className="hover:text-white cursor-pointer">Disclaimer</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4 text-[#f89b1c]">Contact Us</h5>
            <ul className="text-sm text-white/80 space-y-2">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4"/> 1912 (Toll Free)</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4"/> 7575999666</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4"/> support@apdcl.org</li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 border-t border-white/20 pt-6 text-center text-xs text-white/60">
          <p>© {new Date().getFullYear()} Assam Power Distribution Company Limited. All Rights Reserved.</p>
          <p className="mt-1">Designed & Developed as a Virtual Assistant Demo</p>
        </div>
      </footer>

      {/* APDCL GENNIE Floating Widget */}
      <ChatWidget />
      
    </main>
  );
}
