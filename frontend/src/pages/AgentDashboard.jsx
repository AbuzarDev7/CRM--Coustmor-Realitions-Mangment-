import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CheckSquare,
  Users,
  Briefcase,
  Activity,
  LogOut,
  Search,
  Bell,
  Clock,
  Phone,
  PhoneCall,
  Mail,
  Video,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  FileText,
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
  Target,
  ExternalLink,
  X,
  RefreshCw,
  Plus,
  ShieldAlert
} from 'lucide-react'
import { API_BASE_URL, AGENT_API_URL } from '../config/api'

// Initial Priority Tasks for Today's Action Queue
const initialTodayTasks = [
  {
    id: 'task-1',
    clientName: 'Alex Robinson',
    company: 'Vertex Global',
    scheduledTime: '10:30 AM',
    type: 'Call',
    phone: '+14155552671',
    email: 'alex@vertexglobal.com',
    priority: 'Urgent',
    notes: 'Follow up on custom enterprise migration quote ($14,800).',
    completed: false
  },
  {
    id: 'task-2',
    clientName: 'Sophia Martinez',
    company: 'CloudNet Systems',
    scheduledTime: '01:15 PM',
    type: 'Demo',
    phone: '+16505558923',
    email: 'sophia@cloudnet.io',
    priority: 'High',
    notes: 'Live demo of automated pipeline workflows for executive board.',
    completed: false
  },
  {
    id: 'task-3',
    clientName: 'Daniel Craig',
    company: 'Hyperion Logistics',
    scheduledTime: '02:30 PM',
    type: 'Call',
    phone: '+442079460912',
    email: 'd.craig@hyperion.co',
    priority: 'High',
    notes: 'Review revised SLA proposal and finalize user seat count.',
    completed: false
  },
  {
    id: 'task-4',
    clientName: 'Emma Watson',
    company: 'Nova Technologies',
    scheduledTime: '04:45 PM',
    type: 'Email',
    phone: '+12125554481',
    email: 'emma@novatech.org',
    priority: 'Normal',
    notes: 'Send security compliance whitepaper and DPA contract draft.',
    completed: false
  }
]

// Initial Assigned Leads for this Agent
const initialAssignedLeads = [
  {
    _id: 'lead-1',
    name: 'Alex Robinson',
    email: 'alex@vertexglobal.com',
    phone: '+1 (415) 555-2671',
    company: 'Vertex Global',
    source: 'Organic Website',
    status: 'Contacted',
    estimatedValue: 14800,
    lastContact: 'Today, 09:15 AM'
  },
  {
    _id: 'lead-2',
    name: 'Sophia Martinez',
    email: 'sophia@cloudnet.io',
    phone: '+1 (650) 555-8923',
    company: 'CloudNet Systems',
    source: 'Facebook Ads',
    status: 'In Progress',
    estimatedValue: 24500,
    lastContact: 'Yesterday'
  },
  {
    _id: 'lead-3',
    name: 'Daniel Craig',
    email: 'd.craig@hyperion.co',
    phone: '+44 20 7946 0912',
    company: 'Hyperion Logistics',
    source: 'Client Referral',
    status: 'In Progress',
    estimatedValue: 9200,
    lastContact: '2 days ago'
  },
  {
    _id: 'lead-4',
    name: 'Emma Watson',
    email: 'emma@novatech.org',
    phone: '+1 (212) 555-4481',
    company: 'Nova Technologies',
    source: 'Cold Outreach',
    status: 'New',
    estimatedValue: 18000,
    lastContact: '3 days ago'
  },
  {
    _id: 'lead-5',
    name: 'Marcus Vance',
    email: 'm.vance@apex.io',
    phone: '+1 (702) 555-3344',
    company: 'Apex Dynamics',
    source: 'Organic Website',
    status: 'Contacted',
    estimatedValue: 6500,
    lastContact: '4 days ago'
  }
]

// Personal Kanban Deals Pipeline across 4 stages
const initialPipelineDeals = [
  {
    _id: 'deal-1',
    title: 'CloudNet - Enterprise Migration',
    client: 'CloudNet Systems',
    amount: 24500,
    stage: 'In Negotiation',
    closeDate: 'Oct 25, 2026',
    probability: 80
  },
  {
    _id: 'deal-2',
    title: 'Hyperion - Automation Suite',
    client: 'Hyperion Logistics',
    amount: 9200,
    stage: 'Proposal Sent',
    closeDate: 'Oct 28, 2026',
    probability: 60
  },
  {
    _id: 'deal-3',
    title: 'Vertex Global - 12M License',
    client: 'Vertex Global',
    amount: 14800,
    stage: 'Deal Won',
    closeDate: 'Oct 18, 2026',
    probability: 100
  },
  {
    _id: 'deal-4',
    title: 'Nova Tech - 50 Seats CRM',
    client: 'Nova Technologies',
    amount: 18000,
    stage: 'Contacted',
    closeDate: 'Nov 02, 2026',
    probability: 40
  },
  {
    _id: 'deal-5',
    title: 'Apex Dynamics - Custom API Add-on',
    client: 'Apex Dynamics',
    amount: 6500,
    stage: 'Contacted',
    closeDate: 'Nov 05, 2026',
    probability: 45
  }
]

const KANBAN_STAGES = ['Contacted', 'Proposal Sent', 'In Negotiation', 'Deal Won']

const AgentDashboard = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [currentSection, setCurrentSection] = useState('tasks') // 'tasks', 'leads', 'pipeline', 'logs'
  const [toastMessage, setToastMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Daily Tasks State
  const [tasks, setTasks] = useState(initialTodayTasks)

  // Assigned Leads State
  const [leads, setLeads] = useState(initialAssignedLeads)

  // Personal Kanban State
  const [deals, setDeals] = useState(initialPipelineDeals)

  // Activity Logs Stream
  const [activityLogs, setActivityLogs] = useState([
    {
      id: 1,
      title: 'Call logged with Alex Robinson',
      notes: 'Reviewed pricing discount. Scheduled contract finalization for tomorrow.',
      time: '12 mins ago',
      type: 'call'
    },
    {
      id: 2,
      title: 'Proposal Sent to Hyperion Logistics',
      notes: 'Dispatched custom quotation #QT-882 valued at $9,200.',
      time: '1 hour ago',
      type: 'deal'
    },
    {
      id: 3,
      title: 'Deal Won: Vertex Global',
      notes: 'Successfully closed 12-month contract ($14,800).',
      time: 'Yesterday',
      type: 'won'
    }
  ])

  // Modals State
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedLeadForNote, setSelectedLeadForNote] = useState(null)

  // Request Approval Form
  const [approvalForm, setApprovalForm] = useState({
    clientName: 'CloudNet Systems',
    dealTitle: 'CloudNet - Enterprise Migration',
    currentAmount: 24500,
    discountPercent: 15,
    justification: 'Client agreed to sign 2-year prepayment agreement if 15% discount is approved today.'
  })

  // Quick Note Form
  const [noteForm, setNoteForm] = useState({
    notes: '',
    nextFollowUp: 'Tomorrow, 02:00 PM'
  })

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Load user session
  useEffect(() => {
    const storedUser = localStorage.getItem('crm_user')
    const token = localStorage.getItem('crm_token')

    if (!token && !storedUser) {
      navigate('/login')
      return
    }

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (e) {
        console.error(e)
      }
    }

    fetchAgentData()
  }, [navigate])

  const fetchAgentData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${AGENT_API_URL}/dashboard`, {
        headers,
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        if (data.agent) {
          setCurrentUser(data.agent)
          try {
            localStorage.setItem('crm_user', JSON.stringify(data.agent))
          } catch (e) {}
        }
        if (data.leads && data.leads.length > 0) setLeads(data.leads)
        if (data.kanbanDeals && data.kanbanDeals.length > 0) {
          // Normalize stages for local kanban view
          setDeals(
            data.kanbanDeals.map((d) => ({
              ...d,
              stage: d.stage === 'Won' || d.stage === 'Closed Won' ? 'Deal Won' : d.stage
            }))
          )
        }
      }
    } catch (e) {
      console.warn('Backend sync fallback to mock:', e.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    navigate('/login')
  }

  // 1. Task Toggle Done
  const toggleTaskDone = (taskId) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const updated = !t.completed
          if (updated) {
            showToast(`Task for ${t.clientName} marked as completed!`)
          }
          return { ...t, completed: updated }
        }
        return t
      })
    )
  }

  // 2. Reschedule Task Handler
  const handleRescheduleTask = (taskId) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, scheduledTime: 'Tomorrow, 11:00 AM' } : t))
    )
    showToast('Follow-up rescheduled to Tomorrow, 11:00 AM.')
  }

  // 3. Inline Lead Status Update
  const handleLeadStatusChange = async (leadId, newStatus) => {
    setLeads(leads.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l)))
    showToast(`Lead status updated to '${newStatus}'!`)

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${AGENT_API_URL}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })
    } catch (e) {
      console.warn('Backend update error:', e.message)
    }
  }

  // 4. Move Deal Across Kanban Stages
  const handleMoveDealStage = async (dealId, direction) => {
    const deal = deals.find((d) => d._id === dealId)
    if (!deal) return

    const currentIndex = KANBAN_STAGES.indexOf(deal.stage)
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1

    if (newIndex < 0 || newIndex >= KANBAN_STAGES.length) return
    const newStage = KANBAN_STAGES[newIndex]

    setDeals(deals.map((d) => (d._id === dealId ? { ...d, stage: newStage } : d)))
    showToast(`Deal advanced to '${newStage}'!`)

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${AGENT_API_URL}/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ stage: newStage === 'Deal Won' ? 'Won' : newStage })
      })
    } catch (e) {
      console.warn('Backend deal move warning:', e.message)
    }
  }

  // 5. Submit Request Approval Modal
  const handleApprovalSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${AGENT_API_URL}/discount-request`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          clientName: approvalForm.clientName,
          dealTitle: approvalForm.dealTitle,
          currentAmount: approvalForm.currentAmount,
          discountPercent: approvalForm.discountPercent,
          reason: approvalForm.justification
        })
      })

      const data = await res.json()
      showToast(data.message || `Approval request for ${approvalForm.discountPercent}% submitted to Manager!`)
    } catch (err) {
      showToast(`Approval request for ${approvalForm.discountPercent}% submitted to Manager!`)
    }

    setShowApprovalModal(false)
  }

  // 6. Submit Add Note Modal
  const handleNoteSubmit = (e) => {
    e.preventDefault()
    if (!noteForm.notes.trim()) return

    const newLog = {
      id: Date.now(),
      title: `Note logged for ${selectedLeadForNote?.name || 'Lead'}`,
      notes: noteForm.notes,
      time: 'Just now',
      type: 'note'
    }

    setActivityLogs([newLog, ...activityLogs])
    showToast(`Conversation note saved for ${selectedLeadForNote?.name}!`)
    setShowNoteModal(false)
    setNoteForm({ notes: '', nextFollowUp: 'Tomorrow, 02:00 PM' })
  }

  // Computed KPIs
  const pendingTasksCount = tasks.filter((t) => !t.completed).length
  const activeDealsTotalValue = deals
    .filter((d) => d.stage !== 'Deal Won')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)

  // Filtered Leads based on search
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads
    const q = searchQuery.toLowerCase()
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
    )
  }, [leads, searchQuery])

  // Synchronized Agent Profile Details (eliminates username/email mismatch)
  const agentDisplayName = currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Sales Agent')
  const agentDisplayEmail = currentUser?.email || 'agent@onesoft.com'
  const agentInitial = agentDisplayName.charAt(0).toUpperCase()
  const agentFirstName = agentDisplayName.split(' ')[0]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-violet-200 selection:text-violet-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm border border-slate-700 animate-slide-up">
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. CLEAN SIDEBAR NAVIGATION (STRICT AGENT SCOPE)
          ========================================================================= */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-sm hidden md:flex">
        <div>
          {/* Logo & Agent Tag */}
          <div className="h-18 px-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/25 shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <path d="M12 7a5 5 0 015 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">
                Onesoft CRM
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                Sales Agent
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setCurrentSection('tasks')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentSection === 'tasks'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4" />
                <span>My Tasks</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSection === 'tasks' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {pendingTasksCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentSection('leads')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentSection === 'leads'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>My Leads</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSection === 'leads' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentSection('pipeline')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentSection === 'pipeline'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4" />
                <span>Deals Pipeline</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSection === 'pipeline' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {deals.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentSection('logs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentSection === 'logs'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4" />
                <span>Activity Logs</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSection === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activityLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Profile Pill & Sign Out (No User/Staff creation controls) */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {agentInitial}
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-900 text-xs truncate">
                  {agentDisplayName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {agentDisplayEmail}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* =========================================================================
            HEADER (AGENT GREETING, SEARCH, NOTIFICATION BELL)
            ========================================================================= */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Welcome back, {agentFirstName}</span>
              <span className="text-lg">👋</span>
            </h2>
            <p className="text-xs text-slate-500">Here is your prioritized sales action queue for today.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Assigned Leads */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assigned leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            {/* Request Manager Approval Action Button */}
            <button
              onClick={() => setShowApprovalModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-violet-500/25 transition cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Request Approval</span>
            </button>

            {/* Urgent Notification Bell with Unread Badge */}
            <button
              onClick={() => showToast(`You have ${pendingTasksCount} urgent tasks scheduled for today!`)}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Urgent Tasks"
            >
              <Bell className="w-4 h-4" />
              {pendingTasksCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* =========================================================================
              2. DAILY KPI FOCUS CARDS (TOP GRID - 4 CARDS)
              ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* KPI 1: Assigned Leads */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Leads</span>
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">24</span>
                <span className="text-xs text-slate-400 font-semibold ml-1.5">Leads</span>
                <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <span>+4 assigned this week</span>
                </p>
              </div>
            </div>

            {/* KPI 2: Today's Follow-ups (Urgent Badge) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Follow-ups</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {pendingTasksCount}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  Urgent Priority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Calls & demos scheduled</p>
            </div>

            {/* KPI 3: Active Deals in Pipeline */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Deals</span>
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {deals.filter((d) => d.stage !== 'Deal Won').length}
                </span>
                <span className="text-xs text-slate-400 font-semibold ml-1.5">Active</span>
                <p className="text-xs text-slate-600 font-bold mt-1">
                  Valued at ${activeDealsTotalValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* KPI 4: Monthly Target Progress Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Target</span>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-900">$14,500</span>
                  <span className="text-xs font-semibold text-slate-400">/ $25,000</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: '58%' }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] font-bold">
                  <span className="text-emerald-600">58% Achieved</span>
                  <span className="text-slate-400">$10,500 remaining</span>
                </div>
              </div>
            </div>

          </div>

          {/* =========================================================================
              3. "TODAY'S ACTION QUEUE" (PRIORITY TASKS PANEL)
              ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-violet-600" />
                  <span>Today's Action Queue</span>
                </h3>
                <p className="text-xs text-slate-500">Scheduled client outreach with one-click direct communication</p>
              </div>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                {pendingTasksCount} Tasks Pending
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    task.completed
                      ? 'bg-slate-50/70 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          task.type === 'Call'
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : task.type === 'Demo'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {task.type === 'Call' && <Phone className="w-3 h-3" />}
                        {task.type === 'Demo' && <Video className="w-3 h-3" />}
                        {task.type === 'Email' && <Mail className="w-3 h-3" />}
                        {task.type}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">{task.scheduledTime}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        task.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : task.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <p className={`font-bold text-slate-900 text-sm ${task.completed ? 'line-through' : ''}`}>
                      {task.clientName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{task.company}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{task.notes}</p>
                  </div>

                  {/* Quick Contact Buttons & Status Toggle */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {/* Direct Call Button */}
                      <a
                        href={`tel:${task.phone}`}
                        title="Direct Call"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${task.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp Chat"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      {/* Email Button */}
                      <a
                        href={`mailto:${task.email}`}
                        title="Send Email"
                        className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white transition cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Reschedule Button */}
                      <button
                        onClick={() => handleRescheduleTask(task.id)}
                        title="Reschedule"
                        className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 px-1.5 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        Reschedule
                      </button>

                      {/* "Mark Done" toggle */}
                      <button
                        onClick={() => toggleTaskDone(task.id)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-violet-50 hover:bg-violet-100 text-violet-700'
                        }`}
                      >
                        {task.completed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3 h-3 text-violet-500" />
                            <span>Done</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================================
              4. "MY LEADS" TABLE
              ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  <span>My Assigned Leads</span>
                  <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                    {filteredLeads.length} Leads
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Exclusively assigned leads with inline status progression</p>
              </div>

              {/* View toggle or filter */}
              <div className="text-xs font-semibold text-slate-400">
                Click status below to update instantly
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Lead Name & Company</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Lead Source</th>
                    <th className="py-3 px-4 text-right">Est. Value</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No assigned leads found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{lead.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{lead.company}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-700 font-medium">{lead.email}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{lead.phone}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {lead.source}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          ${(lead.estimatedValue || 0).toLocaleString()}
                        </td>

                        {/* Interactive Status Dropdown (New, Contacted, In Progress, Lost, Converted) */}
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={lead.status}
                            onChange={(e) => handleLeadStatusChange(lead._id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer ${
                              lead.status === 'In Progress'
                                ? 'bg-sky-50 text-sky-700 border-sky-300'
                                : lead.status === 'Contacted'
                                ? 'bg-violet-50 text-violet-700 border-violet-300'
                                : lead.status === 'Converted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : lead.status === 'Lost'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Converted">Converted</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </td>

                        {/* Row Action: Add Note */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedLeadForNote(lead)
                              setShowNoteModal(true)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Note</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              5. QUICK PERSONAL KANBAN / DEALS PIPELINE
              ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-violet-600" />
                  <span>Personal Kanban Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500">Move deals forward across key sales stages</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total Deal Pipeline:{' '}
                <strong className="text-slate-900">
                  ${deals.reduce((a, c) => a + (c.amount || 0), 0).toLocaleString()}
                </strong>
              </span>
            </div>

            {/* Kanban Columns (Contacted -> Proposal Sent -> In Negotiation -> Deal Won) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {KANBAN_STAGES.map((stage) => {
                const stageDeals = deals.filter((d) => d.stage === stage)
                const stageTotal = stageDeals.reduce((a, c) => a + (c.amount || 0), 0)

                return (
                  <div key={stage} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            stage === 'Deal Won'
                              ? 'bg-emerald-500'
                              : stage === 'In Negotiation'
                              ? 'bg-amber-500'
                              : stage === 'Proposal Sent'
                              ? 'bg-sky-500'
                              : 'bg-violet-500'
                          }`}
                        />
                        <span className="font-extrabold text-xs text-slate-800">{stage}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {stageDeals.length}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-semibold mb-2.5 flex items-center justify-between">
                      <span>Total Value:</span>
                      <span className="font-bold text-slate-900">${stageTotal.toLocaleString()}</span>
                    </div>

                    {/* Draggable/Movable Deal Cards */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px]">
                      {stageDeals.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                          No deals in {stage}
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <div
                            key={deal._id}
                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-2"
                          >
                            <p className="font-bold text-slate-900 text-xs line-clamp-1">{deal.title}</p>
                            <p className="text-[11px] text-slate-500">{deal.client}</p>

                            <div className="flex items-center justify-between pt-1 text-xs">
                              <span className="font-black text-emerald-600">${(deal.amount || 0).toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{deal.closeDate}</span>
                            </div>

                            {/* Move stage controls */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <button
                                disabled={stage === 'Contacted'}
                                onClick={() => handleMoveDealStage(deal._id, 'prev')}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-800 disabled:opacity-20 flex items-center gap-0.5 cursor-pointer"
                              >
                                <ArrowLeft className="w-3 h-3" /> Back
                              </button>
                              <button
                                disabled={stage === 'Deal Won'}
                                onClick={() => handleMoveDealStage(deal._id, 'next')}
                                className="text-[10px] font-bold text-violet-600 hover:text-violet-800 disabled:opacity-20 flex items-center gap-0.5 cursor-pointer"
                              >
                                Advance <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* =========================================================================
              ACTIVITY LOGS SECTION
              ========================================================================= */}
          {currentSection === 'logs' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-600" />
                    <span>Recent Sales Activity Timeline</span>
                  </h3>
                  <p className="text-xs text-slate-500">Live feed of conversation notes and closed deals</p>
                </div>
              </div>

              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-xs">{log.title}</p>
                      <p className="text-xs text-slate-600">{log.notes}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
          6. "REQUEST APPROVAL" MODAL (DISCOUNT / CUSTOM QUOTE TO MANAGER)
          ========================================================================= */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Request Manager Approval</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit custom discount or pricing approval to Sales Manager</p>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApprovalSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">Manager Approval Pipeline</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your designated Manager will be notified to review and authorize this requested quote.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client / Company Name *</label>
                <input
                  type="text"
                  required
                  value={approvalForm.clientName}
                  onChange={(e) => setApprovalForm({ ...approvalForm, clientName: e.target.value })}
                  placeholder="e.g. CloudNet Systems"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Standard Deal Value ($)</label>
                  <input
                    type="number"
                    value={approvalForm.currentAmount}
                    onChange={(e) => setApprovalForm({ ...approvalForm, currentAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requested Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={approvalForm.discountPercent}
                    onChange={(e) => setApprovalForm({ ...approvalForm, discountPercent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Calculated Price Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Revised Quote for Client</p>
                  <p className="font-black text-slate-900 text-sm">
                    ${(
                      Number(approvalForm.currentAmount || 10000) *
                      (1 - Number(approvalForm.discountPercent || 0) / 100)
                    ).toLocaleString()}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                  -${((Number(approvalForm.currentAmount || 10000) * Number(approvalForm.discountPercent || 0)) / 100).toLocaleString()} Savings
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Business Justification for Manager *</label>
                <textarea
                  rows={3}
                  required
                  value={approvalForm.justification}
                  onChange={(e) => setApprovalForm({ ...approvalForm, justification: e.target.value })}
                  placeholder="Why is this discount needed to secure the contract?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md shadow-violet-500/25 transition cursor-pointer"
                >
                  Submit Approval Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. "ADD NOTE" / LOG CONVERSATION MODAL
          ========================================================================= */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Log Note: {selectedLeadForNote?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedLeadForNote?.company}</p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleNoteSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Conversation Takeaways *</label>
                <textarea
                  rows={4}
                  required
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                  placeholder="Discussed requirements with lead. They requested demo on Thursday afternoon..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Follow-up Reminder</label>
                <input
                  type="text"
                  value={noteForm.nextFollowUp}
                  onChange={(e) => setNoteForm({ ...noteForm, nextFollowUp: e.target.value })}
                  placeholder="Tomorrow, 02:00 PM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md shadow-violet-500/25 transition cursor-pointer"
                >
                  Save Note to Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default AgentDashboard
