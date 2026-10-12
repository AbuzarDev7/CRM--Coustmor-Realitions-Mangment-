import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  TrendingUp,
  DollarSign,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  LogOut,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  MoreVertical,
  X,
  Mail,
  Building,
  Menu
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { API_BASE_URL, ADMIN_API_URL } from '../config/api'

// Mock Data for Charts & Leaderboards
const initialRevenueData = [
  { month: 'Jan', revenue: 42000, target: 35000, deals: 32 },
  { month: 'Feb', revenue: 56000, target: 45000, deals: 44 },
  { month: 'Mar', revenue: 51000, target: 48000, deals: 39 },
  { month: 'Apr', revenue: 68000, target: 58000, deals: 52 },
  { month: 'May', revenue: 79000, target: 65000, deals: 61 },
  { month: 'Jun', revenue: 74000, target: 70000, deals: 58 },
  { month: 'Jul', revenue: 89000, target: 75000, deals: 71 },
  { month: 'Aug', revenue: 98000, target: 82000, deals: 77 },
  { month: 'Sep', revenue: 112000, target: 90000, deals: 84 },
  { month: 'Oct', revenue: 128450, target: 95000, deals: 96 }
]

const leadSourcesData = [
  { name: 'Organic Website', value: 596, color: '#7c3aed' },
  { name: 'Facebook & Social Ads', value: 398, color: '#38bdf8' },
  { name: 'Client Referrals', value: 255, color: '#10b981' },
  { name: 'Cold Outreach & Email', value: 171, color: '#f59e0b' }
]

const initialTeamMembers = [
  {
    id: 1,
    name: 'Bilal Ahmed',
    email: 'bilal.a@onesoft.com',
    role: 'Senior Sales Exec',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    dealsClosed: 34,
    totalValue: 46200,
    successRate: 94,
    status: 'Online'
  },
  {
    id: 2,
    name: 'Sara Khan',
    email: 'sara.k@onesoft.com',
    role: 'Account Executive',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    dealsClosed: 28,
    totalValue: 38900,
    successRate: 89,
    status: 'In Meeting'
  },
  {
    id: 3,
    name: 'Hamza Farooq',
    email: 'hamza.f@onesoft.com',
    role: 'Lead Generation Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    dealsClosed: 24,
    totalValue: 27500,
    successRate: 82,
    status: 'Online'
  },
  {
    id: 4,
    name: 'Ayesha Malik',
    email: 'ayesha.m@onesoft.com',
    role: 'Customer Success Manager',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    dealsClosed: 19,
    totalValue: 21850,
    successRate: 88,
    status: 'Offline'
  }
]

const initialActivities = [
  {
    id: 1,
    title: 'Agent Bilal closed Deal #301',
    description: 'Enterprise ERP Subscription for NexaCorp ($14,500/yr)',
    time: '2 mins ago',
    type: 'deal',
    icon: DollarSign,
    iconColor: 'text-emerald-600 bg-emerald-50'
  },
  {
    id: 2,
    title: 'New inbound lead assigned to Sara',
    description: 'CloudNet Inc requested a personalized demo on CRM pipeline',
    time: '14 mins ago',
    type: 'lead',
    icon: Users,
    iconColor: 'text-violet-600 bg-violet-50'
  },
  {
    id: 3,
    title: 'System backup & Redis sync completed',
    description: 'All 1,420 customer data points synchronized successfully',
    time: '1 hour ago',
    type: 'system',
    icon: CheckCircle2,
    iconColor: 'text-sky-600 bg-sky-50'
  },
  {
    id: 4,
    title: 'Client Payment Processed',
    description: 'Invoice #INV-2026-88 paid by Vertex Media ($5,200)',
    time: '2 hours ago',
    type: 'payment',
    icon: TrendingUp,
    iconColor: 'text-indigo-600 bg-indigo-50'
  }
]

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState('10M')
  
  // Modals & Popovers
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [showAddManagerModal, setShowAddManagerModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  
  // Interactive Staff & Activities State
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers)
  const [activities, setActivities] = useState(initialActivities)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'Account Executive',
    dealsClosed: 0,
    totalValue: 0,
    successRate: 85
  })
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    role: 'Regional Sales Manager',
    department: 'Sales Management',
    monthlyQuota: 100000,
    phone: '',
    password: 'Manager@1234'
  })
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('crm_user')
    const token = localStorage.getItem('crm_token')

    if (!token && !storedUser) {
      navigate('/login')
      return
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error(e)
      }
    }

    fetchLiveAdminData()
  }, [navigate])

  const fetchLiveAdminData = async () => {
    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const staffRes = await fetch(`${ADMIN_API_URL}/staff`, { headers, credentials: 'include' })
      if (staffRes.ok) {
        const sData = await staffRes.json()
        if (sData.staff && sData.staff.length > 0) {
          setTeamMembers(sData.staff)
        }
      }
    } catch (e) {
      console.warn('Backend live sync warning:', e.message)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
      navigate('/login')
    }
  }

  // Super Admin: Add Manager Handler (Persisted to Database)
  const handleAddManagerSubmit = async (e) => {
    e.preventDefault()
    if (!newManager.name.trim() || !newManager.email.trim()) {
      showToast('Name and work email are required!')
      return
    }

    if (!newManager.password.trim()) {
      showToast('Please assign an initial password for the manager!')
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add manager')
      }

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

      // Refresh database records immediately
      await fetchLiveAdminData()
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault()
    if (!newStaff.name.trim() || !newStaff.email.trim()) return

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${ADMIN_API_URL}/staff`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(newStaff)
      })

      if (res.ok) {
        showToast(`Staff member ${newStaff.name} registered and saved!`)
        setShowAddStaffModal(false)
        setNewStaff({
          name: '',
          email: '',
          role: 'Account Executive',
          dealsClosed: 0,
          totalValue: 0,
          successRate: 85
        })
        await fetchLiveAdminData()
        return
      }
    } catch (err) {
      console.warn('Fallback to local state:', err)
    }

    const member = {
      id: Date.now(),
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      avatar: `https://images.unsplash.com/photo-${1535713875002 + teamMembers.length}?w=100&auto=format&fit=crop&q=80`,
      dealsClosed: Number(newStaff.dealsClosed) || 0,
      totalValue: Number(newStaff.totalValue) || 0,
      successRate: Number(newStaff.successRate) || 80,
      status: 'Online'
    }

    setTeamMembers([member, ...teamMembers])
    
    // Add activity log
    const newAct = {
      id: Date.now(),
      title: `New Staff Member Added: ${newStaff.name}`,
      description: `Assigned as ${newStaff.role} with active CRM dashboard credentials`,
      time: 'Just now',
      type: 'user',
      icon: UserCheck,
      iconColor: 'text-violet-600 bg-violet-50'
    }
    setActivities([newAct, ...activities])

    setShowAddStaffModal(false)
    setNewStaff({
      name: '',
      email: '',
      role: 'Account Executive',
      dealsClosed: 0,
      totalValue: 0,
      successRate: 85
    })
    showToast(`Staff member ${member.name} registered successfully!`)
  }

  const handleExportCSV = () => {
    const headers = ['Agent Name,Email,Role,Deals Closed,Total Value ($),Success Rate (%)']
    const rows = teamMembers.map(
      (m) => `"${m.name}","${m.email}","${m.role}",${m.dealsClosed},${m.totalValue},${m.successRate}%`
    )
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `onesoft_crm_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Exported CSV file downloaded successfully!')
  }

  // Filter team members based on search bar
  const filteredTeamMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff / Users', icon: Users, badge: teamMembers.length },
    { id: 'leads', label: 'Leads', icon: UserCheck, badge: '1.4k' },
    { id: 'deals', label: 'Deals Pipeline', icon: Briefcase, badge: '86' },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex overflow-hidden font-sans selection:bg-violet-200 selection:text-violet-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. COLLAPSIBLE SIDEBAR (MATCHING HOME PAGE BRANDING)
          ========================================================================= */}
      <aside
        className={`bg-white border-r border-slate-200/80 transition-all duration-300 z-30 flex flex-col justify-between shadow-sm ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'fixed inset-y-0 left-0 w-64 shadow-2xl' : 'hidden md:flex'}`}
      >
        <div>
          {/* Brand Logo & Collapse Toggle */}
          <div className="h-18 px-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M12 7a5 5 0 015 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">
                    Onesoft CRM
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                    Admin Suite
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 items-center justify-center transition cursor-pointer"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1.5">
            <p className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 ${sidebarCollapsed ? 'text-center' : ''}`}>
              {sidebarCollapsed ? '•••' : 'Main Menu'}
            </p>

            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  
                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className="p-3 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
              {user?.email?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.email?.split('@')[0] || 'Administrator'}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-400 capitalize font-medium">{user?.role || 'Admin'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA & TOP NAVBAR
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-18 flex items-center justify-between gap-4 shadow-2xs">
          
          {/* Mobile Menu & Global Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, leads, deals or invoices..."
                className="w-full pl-10 pr-12 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
              <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick Home Page Link */}
            <Link
              to="/"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-violet-700 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 transition"
              title="Visit CRM Landing Home Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Website</span>
            </Link>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 relative transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white"></span>
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                    <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                    <span className="text-[10px] bg-violet-50 text-violet-700 font-bold px-2 py-0.5 rounded-full">3 New</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-violet-50/50 hover:bg-violet-50 transition text-xs">
                      <p className="font-semibold text-slate-800">Deal Closed: NexaCorp</p>
                      <p className="text-[11px] text-slate-500">Agent Bilal closed $14,500 contract</p>
                      <span className="text-[10px] text-violet-600 font-medium">5m ago</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs">
                      <p className="font-semibold text-slate-800">New Qualified Lead</p>
                      <p className="text-[11px] text-slate-500">Acme Global assigned to Sara</p>
                      <span className="text-[10px] text-slate-400 font-medium">20m ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user?.email?.split('@')[0] || 'Admin'}</p>
                  <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">{user?.role || 'Admin'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-violet-500/20">
                  {user?.email?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
              </button>

              {/* User Menu Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-xs">
                  <div className="p-3 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900 text-sm">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                      Role: {user?.role || 'Admin'}
                    </span>
                  </div>
                  <Link
                    to="/"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Home Landing</span>
                  </Link>
                  <button
                    onClick={() => {
                      showToast('System configuration is running on latest build.')
                      setShowUserDropdown(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Platform Settings</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* =========================================================================
            DASHBOARD BODY
            ========================================================================= */}
        <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* ACTION TOOLBAR & GREETING */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-violet-600 tracking-wider uppercase bg-violet-50 px-2.5 py-0.5 rounded-full">
                  Admin Control Center
                </span>
                <span className="text-xs text-slate-400">• Real-Time Sync</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Enterprise Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Live performance metrics, revenue growth, and active sales team operations.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                to="/manager-dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-violet-50 border border-slate-200 text-slate-700 hover:text-violet-700 font-semibold text-xs transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-violet-600" />
                <span>Manager Portal View</span>
              </Link>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowAddManagerModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 hover:scale-[1.02] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Manager</span>
              </button>

              <button
                onClick={() => setShowAddStaffModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-md shadow-violet-600/30 hover:scale-[1.02] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Staff Member</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              3. TOP KPI CARDS (4 STAT CARDS IN A RESPONSIVE GRID)
              ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* KPI 1: Total Revenue */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">$128,450</p>
              <div className="flex items-center gap-2 mt-2.5 text-xs">
                <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +12.5%
                </span>
                <span className="text-slate-400">vs. last month</span>
              </div>
            </div>

            {/* KPI 2: Total Leads */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Total Leads</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">1,420</p>
              <div className="flex items-center gap-2 mt-2.5 text-xs">
                <span className="inline-flex items-center gap-0.5 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +8.2%
                </span>
                <span className="text-slate-400">monthly increase</span>
              </div>
            </div>

            {/* KPI 3: Active Deals */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Active Deals</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">86</p>
              <div className="flex items-center gap-2 mt-2.5 text-xs">
                <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                  Ongoing Pipeline
                </span>
                <span className="text-slate-400">avg 14 days cycle</span>
              </div>
            </div>

            {/* KPI 4: Conversion Rate */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Conversion Rate</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">24.8%</p>
              <div className="flex items-center gap-2 mt-2.5 text-xs">
                <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +2.1%
                </span>
                <span className="text-slate-400">progress benchmark</span>
              </div>
            </div>

          </div>

          {/* =========================================================================
              4. VISUAL ANALYTICS SECTION (RECHARTS AREA & DONUT GRAPHS)
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Revenue Growth Area Chart (7 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Revenue Growth Analytics
                  </h3>
                  <p className="text-xs text-slate-500">Monthly pipeline closes vs assigned revenue targets</p>
                </div>
                
                {/* Time Range Pills */}
                <div className="bg-slate-100 p-1 rounded-full inline-flex gap-1">
                  {['3M', '6M', '10M', '1Y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition cursor-pointer ${
                        timeRange === range
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Chart with Home Page Theme Color Palette */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={initialRevenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => `$${val / 1000}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                              <p className="font-bold text-violet-300">{label} 2026</p>
                              <p className="font-semibold text-emerald-400">
                                Revenue: ${payload[0]?.value?.toLocaleString()}
                              </p>
                              <p className="text-sky-300">Target: ${payload[1]?.value?.toLocaleString()}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#targetGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend Footer */}
              <div className="flex items-center justify-center gap-6 pt-3 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-violet-600"></span>
                  <span>Closed Revenue ($)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                  <span>Target Benchmark ($)</span>
                </div>
              </div>
            </div>

            {/* Right: Lead Acquisition Channels Donut Chart (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                  Lead Sources
                </h3>
                <p className="text-xs text-slate-500 mb-4">Channel acquisition breakdown</p>

                <div className="h-52 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSourcesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {leadSourcesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-lg">
                                <p className="font-bold">{payload[0].name}</p>
                                <p className="text-violet-300">{payload[0].value} Leads</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Total Count */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-slate-900">1,420</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Leads</span>
                  </div>
                </div>
              </div>

              {/* Source breakdown list */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {leadSourcesData.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="text-slate-600 font-medium">{source.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{source.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* =========================================================================
              5. OPERATIONAL PANELS (TEAM LEADERBOARD & LIVE ACTIVITY TIMELINE)
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Team Performance Leaderboard (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Team Performance Leaderboard
                  </h3>
                  <p className="text-xs text-slate-500">Deals closed and conversion velocity per sales executive</p>
                </div>
                <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
                  {filteredTeamMembers.length} Agents Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b border-slate-100 pb-2">
                      <th className="pb-3 font-semibold">Agent</th>
                      <th className="pb-3 font-semibold text-center">Deals</th>
                      <th className="pb-3 font-semibold text-right">Closed ($)</th>
                      <th className="pb-3 font-semibold text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeamMembers.map((agent) => (
                      <tr key={agent._id || agent.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={agent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt={agent.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-xs sm:text-sm">{agent.name}</p>
                                {agent.category === 'manager' && (
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    Manager
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">{agent.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-800">
                          {agent.dealsClosed}
                        </td>
                        <td className="py-3.5 text-right font-extrabold text-slate-900">
                          ${agent.totalValue.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              agent.successRate >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-violet-50 text-violet-700'
                            }`}
                          >
                            {agent.successRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Live Activity Timeline (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Live Operations Timeline
                    </h3>
                    <p className="text-xs text-slate-500">Real-time alerts and user activities</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live stream active"></span>
                </div>

                <div className="space-y-4">
                  {activities.map((act) => {
                    const ActIcon = act.icon
                    return (
                      <div key={act.id} className="flex items-start gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.iconColor}`}>
                          <ActIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-xs text-slate-800 truncate">{act.title}</p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{act.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                            {act.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-center">
                <button
                  onClick={() => showToast('Full audit log stream updated.')}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition cursor-pointer"
                >
                  View Full Audit Log Stream →
                </button>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* =========================================================================
          MODAL: ADD NEW STAFF MEMBER
          ========================================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Daniyal Tariq"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="daniyal@onesoft.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Title</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs"
                  >
                    <option value="Senior Sales Exec">Senior Sales Exec</option>
                    <option value="Account Executive">Account Executive</option>
                    <option value="Lead Specialist">Lead Specialist</option>
                    <option value="Customer Success">Customer Success</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Success Rate (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newStaff.successRate}
                    onChange={(e) => setNewStaff({ ...newStaff, successRate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deals Closed</label>
                  <input
                    type="number"
                    min="0"
                    value={newStaff.dealsClosed}
                    onChange={(e) => setNewStaff({ ...newStaff, dealsClosed: e.target.value })}
                    placeholder="12"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Closed Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStaff.totalValue}
                    onChange={(e) => setNewStaff({ ...newStaff, totalValue: e.target.value })}
                    placeholder="15000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-md shadow-violet-600/25 transition cursor-pointer"
                >
                  Confirm & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUPER ADMIN: ADD MANAGER MODAL
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
                <label className="block font-semibold text-slate-700 mb-1">Manager Full Name *</label>
                <input
                  type="text"
                  required
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  placeholder="e.g. Imran Siddiqui"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Work Email *</label>
                <input
                  type="email"
                  required
                  value={newManager.email}
                  onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  placeholder="manager@onesoft.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manager Position</label>
                  <select
                    value={newManager.role}
                    onChange={(e) => setNewManager({ ...newManager, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  >
                    <option value="Regional Sales Manager">Regional Sales Manager</option>
                    <option value="Enterprise Sales Director">Enterprise Sales Director</option>
                    <option value="Operations & Team Lead">Operations & Team Lead</option>
                    <option value="Client Success Lead">Client Success Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newManager.department}
                    onChange={(e) => setNewManager({ ...newManager, department: e.target.value })}
                    placeholder="Sales Management"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Team Target Quota ($)</label>
                  <input
                    type="number"
                    value={newManager.monthlyQuota}
                    onChange={(e) => setNewManager({ ...newManager, monthlyQuota: e.target.value })}
                    placeholder="100000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newManager.phone}
                    onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
                    placeholder="+92 301 0000000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Assign Manager Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = 'Mgr@' + Math.floor(1000 + Math.random() * 9000)
                      setNewManager({ ...newManager, password: randomPass })
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newManager.password}
                  onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                  placeholder="e.g. Manager@1234"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The Admin assigns this password. The manager will use this email & password to sign in to the Manager Portal.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddManagerModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/25 transition cursor-pointer"
                >
                  Confirm & Create Manager
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
