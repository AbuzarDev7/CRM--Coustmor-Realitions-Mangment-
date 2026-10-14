import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Settings,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  Check,
  X,
  User,
  Users,
  Plus,
  LogOut,
  Layers,
  Eye,
  Sparkles,
  TrendingUp,
  FileText,
  LayoutDashboard
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { API_BASE_URL, ADMIN_API_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'
import LeadAnalyticsWidget from '../components/LeadAnalyticsWidget'
import AdminReportsWidget from '../components/AdminReportsWidget'
import AdminSettingsWidget from '../components/AdminSettingsWidget'

// CRM Lead Acquisition Channels matching the Donut Chart slices (28%, 25%, 20%, 15%, 12%)
const crmLeadChannelsData = [
  { name: 'Facebook & Social Ads', value: 28, color: '#1877F2' },
  { name: 'Instagram Leadgen', value: 25, color: '#E4405F' },
  { name: 'LinkedIn Outreach', value: 20, color: '#0A66C2' },
  { name: 'Organic Website / SEO', value: 15, color: '#7c3aed' },
  { name: 'Client Referrals', value: 12, color: '#10b981' }
]

// Revenue Velocity Bar Chart data matching the attached visual (1 AUG to 8 AUG with $14,867 spike)
const barRevenueData = [
  { day: '1 AUG', revenue: 21000 },
  { day: '2 AUG', revenue: 11200 },
  { day: '3 AUG', revenue: 14867, label: '$14,867' },
  { day: '4 AUG', revenue: 13500 },
  { day: '5 AUG', revenue: 16800 },
  { day: '6 AUG', revenue: 20400 },
  { day: '7 AUG', revenue: 24500 },
  { day: '8 AUG', revenue: 20200 }
]

const leadSourcesData = [
  { name: 'Organic Website', value: 596, color: '#7c3aed' },
  { name: 'Facebook & Social Ads', value: 398, color: '#1877F2' },
  { name: 'LinkedIn Outreach', value: 245, color: '#0A66C2' },
  { name: 'Twitter / X Campaigns', value: 182, color: '#0f172a' },
  { name: 'Client Referrals', value: 255, color: '#10b981' },
  { name: 'Cold Outreach & Email', value: 171, color: '#f59e0b' }
]

const Dashboard = ({ defaultNav = 'dashboard' }) => {
  const navigate = useNavigate()
  const { user: authUser, logout: authLogout } = useAuth()
  const [user, setUser] = useState(authUser || null)

  // Navigation State: 'dashboard' | 'leads' | 'staff' | 'reports' | 'settings'
  const [activeNav, setActiveNav] = useState(
    defaultNav === 'orders' || defaultNav === 'deals' ? 'dashboard' : defaultNav
  )
  const [timeRange, setTimeRange] = useState('This month')
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Top header popovers
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Database Data States
  const [kpiStats, setKpiStats] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [managers, setManagers] = useState([])
  const [leadSources, setLeadSources] = useState(leadSourcesData)

  // Add Manager Modal State (Super Admin Root Control)
  const [showAddManagerModal, setShowAddManagerModal] = useState(false)
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    role: 'Regional Sales Manager',
    department: 'Sales Management',
    monthlyQuota: 100000,
    phone: '',
    password: 'Manager@1234'
  })

  // Format today's date: "Today, Mon 22 Nov"
  const formattedTodayDate = useMemo(() => {
    const now = new Date()
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' })
    const day = now.getDate()
    const month = now.toLocaleDateString('en-US', { month: 'short' })
    return `Today, ${weekday} ${day} ${month}`
  }, [])

  useEffect(() => {
    if (defaultNav) {
      setActiveNav(
        defaultNav === 'orders' || defaultNav === 'deals' ? 'dashboard' : defaultNav
      )
    }
  }, [defaultNav])

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
    } else {
      const storedUser = localStorage.getItem('crm_user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [authUser])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Fetch live metrics from DB
  const fetchLiveAdminData = async () => {
    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const [mgrRes, staffRes, statsRes] = await Promise.all([
        fetch(`${ADMIN_API_URL}/managers`, { headers, credentials: 'include' }),
        fetch(`${ADMIN_API_URL}/staff`, { headers, credentials: 'include' }),
        fetch(`${ADMIN_API_URL}/dashboard/stats`, { headers, credentials: 'include' })
      ])

      if (mgrRes.ok) {
        const mData = await mgrRes.json()
        setManagers(mData.managers || [])
      }
      if (staffRes.ok) {
        const sData = await staffRes.json()
        setTeamMembers(sData.staff || [])
      }
      if (statsRes.ok) {
        const stData = await statsRes.json()
        if (stData.stats) setKpiStats(stData.stats)
        if (stData.leadSources) setLeadSources(stData.leadSources)
      }
    } catch (e) {
      console.warn('Backend live sync warning:', e.message)
    }
  }

  useEffect(() => {
    fetchLiveAdminData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      if (authLogout) authLogout()
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
      localStorage.removeItem('crm_admin_settings')
      navigate('/login')
    }
  }

  // Super Admin: Add Manager Submission
  const handleAddManagerSubmit = async (e) => {
    e.preventDefault()
    if (!newManager.name.trim() || !newManager.email.trim()) {
      showToast('Name and work email are required!')
      return
    }

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${ADMIN_API_URL}/managers`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(newManager)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add manager')

      showToast(`Success: Manager ${newManager.name} registered and saved to database!`)
      setShowAddManagerModal(false)
      setNewManager({
        name: '',
        email: '',
        role: 'Regional Sales Manager',
        department: 'Sales Management',
        monthlyQuota: 100000,
        phone: '',
        password: 'Manager@1234'
      })
      await fetchLiveAdminData()
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Admin display name
  const adminName = useMemo(() => {
    if (user?.name) return user.name.split(' ')[0]
    if (user?.email) return user.email.split('@')[0]
    return 'Barbara'
  }, [user])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#7c3aed] via-[#8b5cf6] to-[#f8fafc] p-2.5 sm:p-5 lg:p-7 flex flex-col items-center justify-start font-sans selection:bg-violet-200 selection:text-violet-900 overflow-x-hidden">
      
      {/* =========================================================================
          SIGNATURE AURORA MESH BACKGROUND ORBS (FROM HOME.JSX FOR VISUAL CONSISTENCY)
          ========================================================================= */}
      <div className="absolute top-[-10%] left-[-10%] w-[55rem] h-[55rem] bg-gradient-to-tr from-[#38bdf8]/40 via-[#818cf8]/50 to-[#c084fc]/40 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-[5%] right-[-15%] w-[50rem] h-[50rem] bg-gradient-to-bl from-[#a855f7]/50 via-[#38bdf8]/30 to-[#f472b6]/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[25%] w-[45rem] h-[25rem] bg-white/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* =========================================================================
          MAIN FLOATING CARD DASHBOARD SHELL (MATCHING ATTACHED IMAGE & FULLY VISIBLE)
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-[1560px] bg-white/95 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-indigo-950/25 border border-white/80 overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-2.5rem)] md:h-[calc(100vh-3.5rem)]">
        
        {/* =====================================================================
            1. ULTRA-SLEEK VERTICAL ICON SIDEBAR
            ===================================================================== */}
        <aside className="w-full md:w-[74px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-100 flex md:flex-col items-center justify-between py-4 px-3 sm:py-6 h-auto md:h-full overflow-y-auto z-30">
          
          {/* Top: Spiral / Wave Logo + Chevron */}
          <div className="flex md:flex-col items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-900 hover:scale-105 transition-transform shadow-2xs"
              title="Home / CRM Root"
            >
              {/* Spiral/Wave glyph from image */}
              <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 6.5c2.2-1 4.5-1 7 0s5 1 7.5 0" />
                <path d="M3 10.5c2.5-1 5.5-1 8 0s5 1 7.5 0" />
                <path d="M3 14.5c2.5-1 5.5-1 8 0s5.5 1 8 0" />
                <path d="M4 18.5c2.2-1 4.5-1 7 0s5 1 7.5 0" />
              </svg>
            </Link>

            <span className="hidden md:block text-slate-300 text-xs select-none">»</span>
          </div>

          {/* Navigation Icon List */}
          <nav className="flex md:flex-col items-center gap-2 sm:gap-3">
            
            {/* 1. Dashboard / Overview */}
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Overview Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>

            {/* 2. Ingestion & Lead Channels */}
            <button
              onClick={() => setActiveNav('leads')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeNav === 'leads'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Social Lead Ingestion & Webhooks"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* 3. Staff & Managers */}
            <button
              onClick={() => setActiveNav('staff')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeNav === 'staff'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Staff & User Management"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* 4. Executive Reports */}
            <button
              onClick={() => setActiveNav('reports')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeNav === 'reports'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Executive Reports & Audits"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => setActiveNav('settings')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                activeNav === 'settings'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>

          {/* Bottom: Logout Icon */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </aside>

        {/* =====================================================================
            2. MAIN CONTENT AREA (SMOOTH INTERNAL SCROLLING & ZERO CUT-OFF)
            ===================================================================== */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#fafafa]/50">
          
          {/* ===================================================================
              TOP HEADER BAR (SEARCH, DATE PILL, SETTINGS, BELL, AVATAR)
              =================================================================== */}
          <header className="sticky top-0 z-20 px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/90 backdrop-blur-md shrink-0">
            
            {/* Left: Search input + Date pill */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-lg">
              <div className="relative w-full max-w-xs sm:max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search leads, managers, metrics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              {/* Dynamic Live Date Pill matching image */}
              <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-sky-50/80 text-sky-700 text-xs font-bold whitespace-nowrap border border-sky-100">
                <span>{formattedTodayDate}</span>
              </div>
            </div>

            {/* Right: Action Circles & Avatar */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Settings Gear */}
              <button
                onClick={() => setActiveNav('settings')}
                className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-2 right-2.5"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 text-xs">
                    <p className="font-bold text-slate-900 mb-2 pb-1 border-b border-slate-100">Notifications</p>
                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-violet-50 text-violet-900">
                        <span className="font-semibold block">New Meta lead ingested</span>
                        <span className="text-[10px] text-slate-500">Facebook Leadgen • Just now</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900">
                        <span className="font-semibold block">Deal Won: $14,867</span>
                        <span className="text-[10px] text-slate-500">Enterprise Cloud Migration</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Avatar */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-violet-400 transition cursor-pointer"
                  title={user?.email || 'Admin Profile'}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Admin" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'B')}
                    </div>
                  )}
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs font-semibold">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user?.name || adminName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@crm.com'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveNav('settings')
                        setShowUserDropdown(false)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-50 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* ===================================================================
              SUB-VIEW ROUTER (OVERVIEW vs LEADS vs STAFF vs REPORTS vs SETTINGS)
              =================================================================== */}
          <main className="p-4 sm:p-7 pb-20 space-y-6 flex-1 min-w-0">
            
            {/* =================================================================
                SCREEN 1: OVERVIEW CRM DASHBOARD
                ================================================================= */}
            {activeNav === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Greeting & Timeframe Select */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Hello, {adminName}! 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Executive CRM oversight, pipeline velocity & team performance.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Time Range Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                      >
                        <span>{timeRange}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {showTimeDropdown && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 z-50 text-xs font-semibold">
                          {['Today', 'This week', 'This month', 'This quarter', 'This year'].map((t) => (
                            <button
                              key={t}
                              onClick={() => {
                                setTimeRange(t)
                                setShowTimeDropdown(false)
                              }}
                              className={`w-full text-left px-3.5 py-1.5 hover:bg-violet-50 transition cursor-pointer ${
                                timeRange === t ? 'text-violet-700 font-bold bg-violet-50/50' : 'text-slate-700'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Calendar Pill Button */}
                    <button
                      onClick={() => showToast('Calendar date filter active')}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                      title="Select date range"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ROW 1: 4 KPI CARDS (2x2) + REVENUE VELOCITY BAR CHART */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Left: 4 Metric Cards in 2x2 Grid (6 cols) */}
                  <div className="lg:col-span-6 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Card 1: Total Revenue (Vibrant Purple Filled Card) */}
                    <div className="bg-gradient-to-br from-[#5356ff] via-[#6366f1] to-[#7c3aed] text-white p-5 rounded-[1.75rem] shadow-lg shadow-indigo-600/20 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-white/90">Total revenue</span>
                        <button
                          onClick={() => setActiveNav('reports')}
                          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white text-white hover:text-indigo-600 flex items-center justify-center transition cursor-pointer"
                          title="View Reports"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="my-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black tracking-tight">
                            $ {kpiStats?.totalRevenue?.raw ? (kpiStats.totalRevenue.raw / 1000).toFixed(3) : '99.560'}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/25 text-emerald-200 border border-emerald-400/30">
                            ↑ 2.61%
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-white/70 font-medium">This month vs last</span>
                    </div>

                    {/* Card 2: Active Sales Team / Staff */}
                    <div className="bg-white border border-slate-100 p-5 rounded-[1.75rem] shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-slate-600">Active team staff</span>
                        <button
                          onClick={() => setActiveNav('staff')}
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="View Staff Directory"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="my-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            {teamMembers.length > 0 ? teamMembers.length : 35}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            ↑ 4.20%
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">Authorized Managers & Reps</span>
                    </div>

                    {/* Card 3: Total Leads */}
                    <div className="bg-white border border-slate-100 p-5 rounded-[1.75rem] shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-slate-600">Total active leads</span>
                        <button
                          onClick={() => setActiveNav('leads')}
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="View Leads"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="my-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            {kpiStats?.totalLeads?.raw ? kpiStats.totalLeads.raw.toLocaleString() : '45.600'}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            +18 today
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">Real-time Meta Ingestion</span>
                    </div>

                    {/* Card 4: Deals Win Rate */}
                    <div className="bg-white border border-slate-100 p-5 rounded-[1.75rem] shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-slate-600">Deals win rate</span>
                        <button
                          onClick={() => setActiveNav('reports')}
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="View Reports"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="my-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            $ 60.450
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            ↑ 5.67%
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">Pipeline velocity vs last</span>
                    </div>

                  </div>

                  {/* Right: Large Revenue Velocity Bar Chart (6 cols) */}
                  <div className="lg:col-span-6 min-w-0 bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-xs flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Pipeline Revenue</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Won contracts this month vs last</p>
                      </div>

                      <button
                        onClick={() => setActiveNav('reports')}
                        className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-violet-600 transition cursor-pointer"
                        title="View Detailed Revenue Analytics"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Recharts Bar Chart */}
                    <div className="h-60 w-full relative pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barRevenueData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickFormatter={(v) => `$ ${v.toLocaleString()}`}
                            domain={[0, 25000]}
                            ticks={[0, 1000, 5000, 10000, 15000, 20000, 25000]}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
                                    ${payload[0].value?.toLocaleString()}
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar
                            dataKey="revenue"
                            fill="#6366f1"
                            radius={[8, 8, 8, 8]}
                            barSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* ROW 2: BOTTOM 3 SECTIONS (QUALIFIED LEADS, LIVE CUSTOMERS, LEAD CHANNELS DONUT) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Left: 98 Qualified Leads Card (3 cols) */}
                  <div
                    onClick={() => setActiveNav('leads')}
                    className="lg:col-span-3 min-w-0 bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-violet-100 group-hover:text-violet-700 transition">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>

                    <div className="my-4">
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                        98 <span className="text-lg font-bold text-slate-700">leads</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        12 leads <span className="text-rose-500 font-semibold">are awaiting</span> rep assignment.
                      </p>
                    </div>

                    <div className="text-[11px] font-bold text-violet-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>View Leads Ingestion</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Center: 17 Customers Card with Wave Graphic & Floating Action Arrow (4 cols) */}
                  <div className="lg:col-span-4 min-w-0 bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-xs flex flex-col justify-between relative overflow-hidden">
                    
                    {/* Abstract wave pattern from image */}
                    <svg className="absolute right-0 bottom-0 w-44 h-32 text-indigo-200/60 pointer-events-none" viewBox="0 0 150 100" fill="none" stroke="currentColor">
                      <path d="M10 90 C 40 40, 70 80, 100 20 S 140 60, 150 10" strokeWidth="1.2" strokeDasharray="3 3" />
                      <path d="M15 95 C 45 45, 75 85, 105 25 S 145 65, 150 15" strokeWidth="1.2" />
                      <path d="M20 100 C 50 50, 80 90, 110 30 S 150 70, 150 20" strokeWidth="1.2" strokeDasharray="2 2" />
                    </svg>

                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                        <User className="w-4 h-4" />
                      </div>

                      {/* Floating dark circle button from image */}
                      <button
                        onClick={() => setActiveNav('leads')}
                        className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-violet-600 transition shadow-sm cursor-pointer"
                        title="Open Lead Analytics"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-4 relative z-10">
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                        17 <span className="text-lg font-bold text-slate-700">customers</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        17 customers <span className="text-rose-500 font-semibold">are waiting</span> for response.
                      </p>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">Customer Chat Sessions</span>
                  </div>

                  {/* Right: Lead Ingestion by Channel Donut Chart (5 cols) */}
                  <div className="lg:col-span-5 min-w-0 bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-xs flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          Leads by Channel
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">This month vs last</p>
                      </div>

                      <button
                        onClick={() => setActiveNav('leads')}
                        className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-violet-600 transition cursor-pointer"
                        title="View Full Lead Analytics"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      
                      {/* Donut with slice labels matching image */}
                      <div className="sm:col-span-5 min-w-0 h-44 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={crmLeadChannelsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="#ffffff"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="text-[9px] font-bold"
                                  >
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                )
                              }}
                              labelLine={false}
                            >
                              {crmLeadChannelsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
                                      {payload[0].name}: {payload[0].value}%
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend List on Right */}
                      <div className="sm:col-span-7 min-w-0 space-y-1.5 text-xs">
                        {crmLeadChannelsData.map((cat, idx) => (
                          <div key={idx} className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-slate-600 truncate font-semibold text-[11px]">{cat.name}</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* =================================================================
                SCREEN 2: SOCIAL MEDIA LEAD INGESTION & WEBHOOKS
                ================================================================= */}
            {activeNav === 'leads' && (
              <LeadAnalyticsWidget />
            )}

            {/* =================================================================
                SCREEN 3: EXECUTIVE REPORTS & INTELLIGENCE
                ================================================================= */}
            {activeNav === 'reports' && (
              <AdminReportsWidget
                kpiStats={kpiStats}
                revenueData={barRevenueData}
                leadSources={leadSources}
                teamMembers={teamMembers}
                managers={managers}
                showToast={showToast}
              />
            )}

            {/* =================================================================
                SCREEN 4: ADMIN & PLATFORM SETTINGS
                ================================================================= */}
            {activeNav === 'settings' && (
              <AdminSettingsWidget
                user={user}
                showToast={showToast}
                onUserUpdated={(updated) => setUser(updated)}
              />
            )}

            {/* =================================================================
                SCREEN 5: STAFF & AUTHORIZED MANAGERS DIRECTORY (ROOT OVERSIGHT)
                ================================================================= */}
            {activeNav === 'staff' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & User Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Inspect all authorized sales managers, agents, and quotas</p>
                  </div>

                  <button
                    onClick={() => setShowAddManagerModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Manager</span>
                  </button>
                </div>

                {/* Managers Directory */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
                  <h3 className="font-bold text-base text-slate-900 mb-3">Authorized Managers Directory</h3>
                  {managers.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No managers registered yet. Click "+ Add Manager" above.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 uppercase font-bold border-b border-slate-100 pb-2">
                            <th className="pb-3 pl-1 font-semibold">Manager Profile</th>
                            <th className="pb-3 text-center font-semibold">Department</th>
                            <th className="pb-3 text-right font-semibold">Quota Target</th>
                            <th className="pb-3 text-center font-semibold">Status</th>
                            <th className="pb-3 text-right font-semibold pr-1">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {managers.map((mgr) => (
                            <tr key={mgr._id || mgr.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3.5 pl-1">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={mgr.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                                    alt={mgr.name}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                  />
                                  <div>
                                    <p className="font-bold text-slate-900">{mgr.name}</p>
                                    <p className="text-[11px] text-slate-400">{mgr.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 text-slate-700">
                                  {mgr.department || 'Sales Management'}
                                </span>
                              </td>
                              <td className="py-3.5 text-right font-extrabold text-slate-900">
                                ${(mgr.monthlyQuota || 100000).toLocaleString()}/mo
                              </td>
                              <td className="py-3.5 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>{mgr.status || 'Active'}</span>
                                </span>
                              </td>
                              <td className="py-3.5 text-right pr-1">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/manager?managerId=${mgr._id || mgr.id}&managerName=${encodeURIComponent(
                                        mgr.name
                                      )}&managerEmail=${encodeURIComponent(mgr.email)}&impersonate=true`
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition cursor-pointer"
                                  title="View and inspect Manager Dashboard"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Dashboard</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* =========================================================================
          MODAL: ADD MANAGER (SUPER ADMIN ROOT CONTROL)
          ========================================================================= */}
      {showAddManagerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>+ Add New Manager</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Super Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Authorize manager with team management permissions</p>
              </div>
              <button
                onClick={() => setShowAddManagerModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManagerSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  placeholder="e.g. Haider Abbas"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={newManager.email}
                  onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  placeholder="e.g. haider@gmail.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newManager.department}
                    onChange={(e) => setNewManager({ ...newManager, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Sales Management">Sales Management</option>
                    <option value="Enterprise Solutions">Enterprise Solutions</option>
                    <option value="Lead Operations">Lead Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Quota ($)</label>
                  <input
                    type="number"
                    value={newManager.monthlyQuota}
                    onChange={(e) => setNewManager({ ...newManager, monthlyQuota: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Direct Password Assignment *</label>
                <input
                  type="password"
                  required
                  value={newManager.password}
                  onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddManagerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Register Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard
