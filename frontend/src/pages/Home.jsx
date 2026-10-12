import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  const [activeTab, setActiveTab] = useState('calendar')
  const [activeFaq, setActiveFaq] = useState(0)
  const [heroEmail, setHeroEmail] = useState('')
  const [bottomEmail, setBottomEmail] = useState('')
  const [demoSubmitted, setDemoSubmitted] = useState(false)

  const handleDemoSubmit = (e, emailVal) => {
    e.preventDefault()
    if (emailVal) {
      setDemoSubmitted(true)
      setTimeout(() => setDemoSubmitted(false), 4000)
    }
  }

  const faqs = [
    {
      q: 'How does One Soft CRM differ from traditional CRM software solutions?',
      a: 'One Soft combines calendar scheduling, conversational chat, sales pipeline CRM, and ERP operations into one seamless platform. Instead of managing and paying for 4 separate apps, your team operates from a single, beautiful dashboard with zero data silos.'
    },
    {
      q: 'Can your ERP system be customized to specific business needs?',
      a: 'Yes, absolutely. You can configure custom deal pipelines, invoice templates, automated notification rules, role permissions (Admin, Engineer, Customer), and currencies to fit your exact business workflows.'
    },
    {
      q: 'How does your CRM software improve team collaboration?',
      a: 'With real-time activity feeds, integrated calendar scheduling, shared client interaction histories, and instant team chat, your sales, support, and operations teams stay perfectly aligned on every account.'
    },
    {
      q: 'What kind of customer support do you offer for new subscribers?',
      a: 'We offer 24/7 priority customer support via live chat and email, along with personalized onboarding webinars, API documentation, and dedicated customer success managers for growing teams.'
    },
    {
      q: 'Is there a 14-day free trial available with your account?',
      a: 'Yes! You can create your account and access all core features completely free for 14 days without requiring any credit card details up front.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-violet-200 selection:text-violet-900">
      
      {/* =========================================================================
          HERO & HEADER SECTION (WITH PURPLE/CYAN AURORA MESH BACKGROUND)
          ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#7c3aed] via-[#8b5cf6] to-[#f8fafc] pb-24 pt-4">
        
        {/* Organic Aurora Glow Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[55rem] h-[55rem] bg-gradient-to-tr from-[#38bdf8]/40 via-[#818cf8]/50 to-[#c084fc]/40 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-[5%] right-[-15%] w-[50rem] h-[50rem] bg-gradient-to-bl from-[#a855f7]/50 via-[#38bdf8]/30 to-[#f472b6]/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] left-[25%] w-[45rem] h-[25rem] bg-white/20 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* FLOATING GLASS NAVBAR */}
          <nav className="glass-nav rounded-full px-5 py-3 flex items-center justify-between shadow-lg shadow-purple-900/10 mb-16 max-w-5xl mx-auto transition-all">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M12 7a5 5 0 015 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">Onesoft</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-white/90">
              <a href="#solutions" className="hover:text-white transition flex items-center gap-1">
                Products <span className="text-xs opacity-75">▾</span>
              </a>
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#reviews" className="hover:text-white transition">Reviews</a>
              <a href="#articles" className="hover:text-white transition">Blog</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-white/90 hover:text-white text-sm font-medium px-3 py-1.5 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-white text-violet-700 hover:bg-violet-50 text-sm font-semibold px-5 py-2 rounded-full shadow-md shadow-purple-950/20 hover:scale-[1.02] transition-all cursor-pointer"
              >
                Register
              </Link>
            </div>
          </nav>

          {/* HERO CONTENT */}
          <div className="text-center max-w-3xl mx-auto pt-4 pb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-sm mb-6">
              Boost Business <br />
              <span className="text-white/95">All-in-One Software</span>
            </h1>
            
            <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Boost your business with our integrated software, combining essential tools into one powerful platform for greater efficiency.
            </p>

            {/* HERO CTA PILL INPUT */}
            <form
              onSubmit={(e) => handleDemoSubmit(e, heroEmail)}
              className="glass-panel p-1.5 rounded-full flex items-center max-w-md mx-auto shadow-2xl shadow-purple-950/20 border border-white/60 mb-4"
            >
              <input
                type="email"
                required
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-transparent px-5 py-2.5 text-sm text-slate-800 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-md shadow-violet-700/30 whitespace-nowrap transition cursor-pointer"
              >
                Request Demo
              </button>
            </form>

            {demoSubmitted && (
              <p className="text-emerald-100 text-sm font-medium bg-emerald-600/30 backdrop-blur inline-block px-4 py-1.5 rounded-full border border-emerald-300/40 animate-fade-in">
                ✓ Thank you! Our solution advisor will reach out shortly.
              </p>
            )}
          </div>

          {/* 4 FEATURE PREVIEW CARDS (GRID DIRECTLY FROM IMAGE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            
            {/* Card 1: One-Soft Calendar */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-xl shadow-purple-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Mini mockup widget */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium">
                    <span>August 2024</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">
                      📅
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">10:30 AM Client Sync</p>
                      <p className="text-[10px] text-slate-400">Google Meet</p>
                    </div>
                    <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                      Confirmed
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">One-Soft Calendar</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Effortless Calendar Management for Teams, Professionals, and Busy Entrepreneurs.
                </p>
              </div>
            </div>

            {/* Card 2: One-Soft Chat */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-xl shadow-purple-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Mini mockup widget */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 shadow-sm">
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      JS
                    </div>
                    <div className="bg-white border border-slate-100 rounded-xl rounded-tl-none px-3 py-1.5 text-[11px] text-slate-700 shadow-xs">
                      Hello, how can I assist you?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-violet-600 text-white rounded-xl rounded-tr-none px-3 py-1.5 text-[11px] shadow-xs">
                      Need CRM pricing plan info!
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">One-Soft Chat</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Intuitive Chatbot for Customer Support, Lead Generation, and Enhanced Engagement.
                </p>
              </div>
            </div>

            {/* Card 3: One-Soft CRM */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-xl shadow-purple-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Mini mockup widget */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 shadow-sm">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-semibold text-slate-700">Deals Pipeline</span>
                    <span className="text-emerald-600 font-bold">$94,200</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="bg-white border border-slate-100 rounded-lg p-2 flex justify-between items-center text-[10px]">
                      <span className="font-medium text-slate-800 truncate max-w-[100px]">Enterprise SaaS</span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Won</span>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-lg p-2 flex justify-between items-center text-[10px]">
                      <span className="font-medium text-slate-800 truncate max-w-[100px]">Design Agency</span>
                      <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Pending</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">One-Soft CRM</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Streamlined CRM for Sales Teams, Marketers, and Customer Success Managers.
                </p>
              </div>
            </div>

            {/* Card 4: One-Soft ERP */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-xl shadow-purple-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Mini mockup widget */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400 font-medium">Total Value</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+18.4%</span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 mb-3">$75,150</p>
                  {/* Miniature vertical bars */}
                  <div className="flex items-end justify-between h-9 px-1 gap-1.5">
                    <div className="w-full bg-violet-200 rounded-t h-[40%]"></div>
                    <div className="w-full bg-violet-300 rounded-t h-[65%]"></div>
                    <div className="w-full bg-violet-400 rounded-t h-[50%]"></div>
                    <div className="w-full bg-violet-500 rounded-t h-[80%]"></div>
                    <div className="w-full bg-violet-600 rounded-t h-[100%]"></div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">One-Soft ERP</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Complete ERP Solution for Efficient Operations, Financial Management, and Growth.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* =========================================================================
          SECTION 2: EXPLORE OUR COMPLETE RANGE OF SOLUTIONS (INTERACTIVE SHOWCASE)
          ========================================================================= */}
      <section id="solutions" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-violet-100 text-violet-700 mb-3">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Our Complete Range of Solutions
          </h2>
        </div>

        {/* Interactive Pill Tabs Switcher (as in screenshot) */}
        <div className="flex justify-center mb-14">
          <div className="bg-slate-100/90 p-1.5 rounded-full border border-slate-200 inline-flex gap-1.5 shadow-xs">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-sky-400 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-sky-400 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'crm'
                  ? 'bg-sky-400 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CRM
            </button>
            <button
              onClick={() => setActiveTab('erp')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'erp'
                  ? 'bg-sky-400 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ERP
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Showcase Panel */}
        <div className="bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-sky-400/10 border border-violet-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl shadow-purple-900/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Feature Highlights */}
            <div className="lg:col-span-5 space-y-6">
              {activeTab === 'calendar' && (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    Effortless Scheduling at Your Fingertips
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Say goodbye to double-bookings and time-zone confusion. Sync your team's appointments, customer demonstrations, and follow-ups effortlessly in one unified calendar.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Direct synchronization with Google Calendar & Outlook
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Automated client reminders via Email and SMS
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      One-click meeting logs saved directly to customer records
                    </li>
                  </ul>
                </>
              )}

              {activeTab === 'chat' && (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    Smart Chatbot & Real-Time Team Communication
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Deliver instant answers to inquiries with integrated AI chatbot automation, and let your support agents jump into customer conversations instantly.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      24/7 automated lead qualification and FAQ resolution
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Seamless agent handoff with full chat history preserved
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Multi-channel integration across Web, WhatsApp, and Email
                    </li>
                  </ul>
                </>
              )}

              {activeTab === 'crm' && (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    360° Customer Relations & Sales Pipelines
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Track every prospect from initial touchpoint to closed deal. Visualize pipelines, prioritize high-value leads, and grow revenue with predictive deal scoring.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Drag-and-drop customizable sales pipeline stages
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Complete activity logs, calls, and email correspondence
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Automated follow-up reminders so no lead falls through
                    </li>
                  </ul>
                </>
              )}

              {activeTab === 'erp' && (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    Comprehensive Operations & Financial Control
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Connect invoicing, billing, expense tracking, and resource management with your sales pipeline for complete end-to-end operational visibility.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Instant quotes, automatic invoices, and recurring billing
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Live financial dashboards with profit and loss statements
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                      Role-based access controls for Admin, Engineers, and Staff
                    </li>
                  </ul>
                </>
              )}

              <div className="pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 transition cursor-pointer"
                >
                  Start Using Free
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Visual Dashboard Mockup (Matching image styling) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-indigo-950/10 p-6 sm:p-7 relative overflow-hidden">
                
                {/* Mockup Topbar */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      JM
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Jessica Miller</h4>
                      <p className="text-xs text-slate-400">Head of Operations • Onesoft CRM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-600">Active Pipeline</span>
                  </div>
                </div>

                {/* Content according to tab */}
                {activeTab === 'calendar' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-violet-50/70 border border-violet-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                          Up Next
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm sm:text-base mt-1">
                          Daily follow-up meeting with designer
                        </h5>
                        <p className="text-xs text-slate-500">11:00 AM - 12:00 PM • Zoom Conference</p>
                      </div>
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
                          A
                        </div>
                        <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
                          R
                        </div>
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
                          S
                        </div>
                      </div>
                    </div>

                    {/* Interactive Calendar Grid */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-3">
                        <span>November 2026</span>
                        <span className="text-violet-600 font-semibold cursor-pointer">View Week ▾</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 font-medium mb-2">
                        <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                        <span className="p-2 text-slate-300">28</span>
                        <span className="p-2 text-slate-300">29</span>
                        <span className="p-2 text-slate-700 hover:bg-violet-100 rounded-lg transition">1</span>
                        <span className="p-2 text-slate-700 hover:bg-violet-100 rounded-lg transition">2</span>
                        <span className="p-2 text-slate-700 hover:bg-violet-100 rounded-lg transition">3</span>
                        <span className="p-2 bg-violet-600 text-white rounded-lg shadow-sm">4</span>
                        <span className="p-2 text-slate-700 hover:bg-violet-100 rounded-lg transition">5</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          AI
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-xs text-slate-700 shadow-xs max-w-sm">
                          Hi there! Welcome to Onesoft. Would you like to schedule a quick 10-minute demo with our product specialist?
                        </div>
                      </div>
                      <div className="flex justify-end gap-2.5">
                        <div className="bg-violet-600 text-white p-3 rounded-2xl rounded-tr-none text-xs shadow-xs max-w-sm">
                          Yes please, I'd like to see the ERP billing & CRM sync!
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          AI
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-xs text-slate-700 shadow-xs max-w-sm">
                          Great! Calendar opened on your right. Pick your preferred date.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'crm' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">New Leads (14)</p>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg mt-2 text-xs shadow-xs">
                          <p className="font-bold text-slate-800">Acme Global</p>
                          <p className="text-[10px] text-violet-600 font-semibold">$18,500/yr</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Negotiation (6)</p>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg mt-2 text-xs shadow-xs">
                          <p className="font-bold text-slate-800">Vertex Media</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">$34,000/yr</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Closed Won (28)</p>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg mt-2 text-xs shadow-xs">
                          <p className="font-bold text-slate-800">CloudNet Inc</p>
                          <p className="text-[10px] text-blue-600 font-semibold">$62,000/yr</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'erp' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                        <span className="text-xs text-slate-400">Total Monthly Revenue</span>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">$148,920</p>
                        <span className="text-[10px] text-emerald-600 font-bold">▲ +24.8% vs last month</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                        <span className="text-xs text-slate-400">Operational Expenses</span>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">$41,200</p>
                        <span className="text-[10px] text-slate-500 font-semibold">Under target by 12%</span>
                      </div>
                    </div>
                    <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-3 text-xs flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Auto Invoicing Engine</span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Active & Synced</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* =========================================================================
          SECTION 3: TESTIMONIALS (MATCHING DESIGN LAYOUT)
          ========================================================================= */}
      <section id="reviews" className="py-20 bg-slate-50/60 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-violet-100 text-violet-700 mb-3">
              Reviews
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Discover How Our Clients Achieve Success with Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Featured Highlighted Purple Card */}
            <div className="bg-gradient-to-br from-violet-700 to-indigo-800 text-white rounded-3xl p-8 shadow-xl shadow-purple-900/15 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
              <div>
                <div className="text-violet-300 text-4xl font-serif mb-4">“</div>
                <p className="text-sm sm:text-base leading-relaxed text-white/95 font-medium mb-6">
                  Onesoft revolutionized how our sales and customer teams operate. We went from juggling four different subscriptions to managing calendar, leads, chat, and invoices in one screen. Our team velocity doubled within 60 days.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm">
                  SJ
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Sarah Jenkins</h4>
                  <p className="text-xs text-violet-200">VP of Growth, TechNova</p>
                </div>
              </div>
            </div>

            {/* Testimonial Card 2 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-lg shadow-slate-200/50 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
              <div>
                <div className="flex text-amber-400 gap-1 text-sm mb-4">
                  ★ ★ ★ ★ ★
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  The automated calendar scheduling and immediate CRM lead generation eliminated hours of tedious manual data entry every week. Our response times dropped from 4 hours to under 3 minutes.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                  MS
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Marcus Sterling</h4>
                  <p className="text-xs text-slate-400">Founder & CEO, NexaCorp</p>
                </div>
              </div>
            </div>

            {/* Testimonial Card 3 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-lg shadow-slate-200/50 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
              <div>
                <div className="flex text-amber-400 gap-1 text-sm mb-4">
                  ★ ★ ★ ★ ★
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Finally, enterprise software that doesn't feel clunky or bloated. It looks state-of-the-art, runs lightning fast, and our customer satisfaction score jumped to 98% in our first quarter.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                  ER
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Elena Rostova</h4>
                  <p className="text-xs text-slate-400">Operations Director, SkyBridge</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4: ARTICLES / NEWS (MATCHING IMAGE DESIGN)
          ========================================================================= */}
      <section id="articles" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-violet-100 text-violet-700 mb-3">
            Articles
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Get Ready for What's Unfolding Around the World
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Article Card 1 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                  August 2026
                </span>
                <div className="h-14 mt-3 flex items-center justify-center text-3xl">
                  🚀
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Maximizing Business Efficiency with Unified Platforms
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Discover how consolidating disjointed business software reduces subscription overhead and accelerates customer acquisition.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer">
                Read Article →
              </span>
              <span className="text-[11px] text-slate-400">4 min read</span>
            </div>
          </div>

          {/* Article Card 2 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                  Customer Tech
                </span>
                <div className="h-14 mt-3 flex items-center justify-center text-3xl">
                  💬
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Modern Chatbot Solutions for High Customer Retention
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                How intelligent conversational agents bridge the gap between initial contact and lifelong loyalty with instant personalization.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer">
                Read Article →
              </span>
              <span className="text-[11px] text-slate-400">5 min read</span>
            </div>
          </div>

          {/* Article Card 3 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  ERP & Operations
                </span>
                <div className="h-14 mt-3 flex items-center justify-center text-3xl">
                  📊
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                How Unified CRM & ERP Save Over 15 Hours Weekly
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Eliminate manual invoice generation, cross-referencing errors, and disconnected financial forecasts once and for all.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer">
                Read Article →
              </span>
              <span className="text-[11px] text-slate-400">6 min read</span>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================================================
          SECTION 5: FAQ ACCORDION (MATCHING IMAGE DESIGN)
          ========================================================================= */}
      <section id="faq" className="py-20 bg-slate-50/70 border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-violet-100 text-violet-700 mb-3">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Get Answers to Your Top Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen ? 'border-violet-300 shadow-md shadow-violet-500/5' : 'border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-800">
                      {faq.q}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-200 shrink-0 ${
                        isOpen
                          ? 'bg-violet-600 text-white rotate-45'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      +
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6: BOTTOM CALL TO ACTION BANNER (MATCHING IMAGE DESIGN)
          ========================================================================= */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-700 to-violet-800 text-white">
        
        {/* Soft Background Orbs */}
        <div className="absolute top-[-50%] right-[-10%] w-[45rem] h-[45rem] bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-50%] left-[-10%] w-[45rem] h-[45rem] bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Experience Integrated Solutions <br className="hidden sm:inline" />
            for Your Team's Needs
          </h2>
          <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of ambitious companies accelerating their customer pipeline with Onesoft.
          </p>

          <form
            onSubmit={(e) => handleDemoSubmit(e, bottomEmail)}
            className="glass-panel p-1.5 rounded-full flex items-center max-w-md mx-auto shadow-2xl border border-white/40 mb-4"
          >
            <input
              type="email"
              required
              value={bottomEmail}
              onChange={(e) => setBottomEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full bg-transparent px-5 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-md whitespace-nowrap transition cursor-pointer"
            >
              Request Demo
            </button>
          </form>

          <div className="flex justify-center items-center gap-6 text-xs text-white/70 pt-2 font-medium">
            <span>✓ 14-Day Free Trial</span>
            <span>✓ No Credit Card Required</span>
            <span>✓ Instant Onboarding</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (MATCHING IMAGE DESIGN)
          ========================================================================= */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
              O
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Onesoft</span>
            <span className="text-slate-600 ml-2">All-in-One CRM Platform</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="#solutions" className="hover:text-white transition">Products</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#reviews" className="hover:text-white transition">Reviews</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="text-violet-400 hover:text-violet-300 transition">Register</Link>
          </div>

          <p className="text-slate-500">
            © {new Date().getFullYear()} Onesoft CRM. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}

export default Home
