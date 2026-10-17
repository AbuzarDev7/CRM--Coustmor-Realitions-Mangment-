import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  LogOut,
  Layers,
  Sparkles,
  X,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Search,
  Building2,
  Send,
  BarChart3,
  TrendingUp,
  UserCheck
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts'
import { MANAGER_API_URL, LEADS_API_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'
import ManualLeadModal from '../components/ManualLeadModal'

const ManagerDashboard = () => {
  const navigate = useNavigate()
  const { user: authUser, logout: authLogout } = useAuth()
  const [currentUser, setCurrentUser] = useState(authUser || null)

  // Navigation sub-views: 'overview' | 'agents'
  const [activeTab, setActiveTab] = useState('overview')
  const [leadFilter, setLeadFilter] = useState('unassigned') // 'unassigned' | 'all'
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal State for Manual Lead Entry
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)

  // Real Database States (Zero fake financial stats, zero expense trackers)
  const [stats, setStats] = useState({
    totalLeads: 0,
    unassignedLeads: 0,
    assignedLeads: 0,
    activeAgents: 0,
    newLeads: 0,
    inProgressLeads: 0,
    siteVisitsScheduled: 0,
    dealsClosed: 0
  })

  const [leadStatusDistribution, setLeadStatusDistribution] = useState([
    { name: 'New Leads', count: 0, fill: '#8b5cf6' },
    { name: 'In Progress', count: 0, fill: '#3b82f6' },
    { name: 'Site Visits', count: 0, fill: '#f59e0b' },
    { name: 'Deals Closed', count: 0, fill: '#10b981' }
  ])

  const [agents, setAgents] = useState([])
  const [unassignedLeads, setUnassignedLeads] = useState([])
  const [allLeads, setAllLeads] = useState([])
  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState({})

  // Modal State for Creating Agent
  const [showAddAgentModal, setShowAddAgentModal] = useState(false)
  const [submittingAgent, setSubmittingAgent] = useState(false)
  const [agentModalError, setAgentModalError] = useState('')
  const [agentForm, setAgentForm] = useState({
    name: '',
    email: '',
    password: 'Agent@1234',
    phone: '',
    role: 'Real Estate Agent'
  })

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Load user session
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser)
    } else {
      const stored = localStorage.getItem('crm_user')
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [authUser])

  // Fetch Manager Overview & Dashboard Data strictly from database
  const fetchManagerData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Call GET /api/manager/dashboard which returns overview stats + distribution + leads + agents
      const res = await fetch(`${MANAGER_API_URL}/dashboard`, {
        headers,
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        if (data.stats) {
          setStats(data.stats)
        }
        if (data.leadStatusDistribution) {
          setLeadStatusDistribution(data.leadStatusDistribution)
        }
        if (data.agents) {
          setAgents(data.agents)
        }
        if (data.unassignedLeads) {
          setUnassignedLeads(data.unassignedLeads)
        }
        if (data.allLeads) {
          setAllLeads(data.allLeads)
        }
        if (data.manager) {
          setCurrentUser((prev) => ({ ...prev, ...data.manager }))
        }
      }
    } catch (err) {
      console.warn('Manager fetch error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManagerData()
  }, [])

  // Callback when a manual lead is created
  const handleLeadCreated = (newLead) => {
    showToast(`Lead '${newLead.clientName}' added successfully from ${newLead.source}!`)
    fetchManagerData()
  }

  // Assign Lead to Agent
  const handleAssignLead = async (leadId) => {
    const targetAgentId = selectedAgentForAssign[leadId]
    if (!targetAgentId) {
      showToast('Please select an agent from the dropdown first')
      return
    }

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${LEADS_API_URL}/assign/${leadId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ assignedAgent: targetAgentId })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign lead')
      }

      showToast(data.message || 'Lead assigned to agent successfully!')
      setSelectedAgentForAssign((prev) => {
        const next = { ...prev }
        delete next[leadId]
        return next
      })
      fetchManagerData()
    } catch (err) {
      showToast(err.message || 'Error assigning lead')
    }
  }

  // Create Agent Account
  const handleAddAgentSubmit = async (e) => {
    e.preventDefault()
    setSubmittingAgent(true)
    setAgentModalError('')

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${MANAGER_API_URL}/agents`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(agentForm)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create agent')
      }

      showToast(data.message || `Agent '${agentForm.name}' created successfully!`)
      setShowAddAgentModal(false)
      setAgentModalError('')
      setAgentForm({
        name: '',
        email: '',
        password: 'Agent@1234',
        phone: '',
        role: 'Real Estate Agent'
      })
      // Automatically switch to agents view so user immediately sees their new agent
      setActiveTab('agents')
      fetchManagerData()
    } catch (err) {
      setAgentModalError(err.message || 'Error creating agent')
      showToast(err.message || 'Error creating agent')
    } finally {
      setSubmittingAgent(false)
    }
  }

  // Delete Agent
  const handleDeleteAgent = async (agentId, agentName) => {
    if (!window.confirm(`Are you sure you want to remove Agent '${agentName}'?`)) {
      return
    }

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${MANAGER_API_URL}/agents/${agentId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      if (res.ok) {
        showToast(`Agent '${agentName}' removed.`)
        fetchManagerData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to delete agent')
      }
    } catch (err) {
      showToast(err.message || 'Error deleting agent')
    }
  }

  const handleLogout = () => {
    if (authLogout) {
      authLogout()
    } else {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
    }
    navigate('/login')
  }

  // Filtered Leads
  const displayedLeads = useMemo(() => {
    const list = leadFilter === 'unassigned' ? unassignedLeads : allLeads
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (l) =>
        (l.clientName && l.clientName.toLowerCase().includes(q)) ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.propertyType && l.propertyType.toLowerCase().includes(q)) ||
        (l.requirements && l.requirements.toLowerCase().includes(q))
    )
  }, [leadFilter, unassignedLeads, allLeads, searchQuery])

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents
    const q = searchQuery.toLowerCase()
    return agents.filter(
      (ag) =>
        (ag.name && ag.name.toLowerCase().includes(q)) ||
        (ag.email && ag.email.toLowerCase().includes(q)) ||
        (ag.role && ag.role.toLowerCase().includes(q))
    )
  }, [agents, searchQuery])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[80] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200">
            <Link to="/" className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">Property CRM</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">Manager Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                activeTab === 'overview' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview & Leads</span>
              {unassignedLeads.length > 0 && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  {unassignedLeads.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                activeTab === 'agents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Agent Management</span>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {agents.length}
              </span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'Sales Manager'}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'manager@crm.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Superadmin Oversight Banner */}
        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-900 px-8 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 shadow-xs border-b border-amber-600/20">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse" />
              <span>Superadmin Oversight Mode: You have full administrative view of the Manager Portal.</span>
            </div>
            <Link
              to="/dashboard"
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <span>← Back to Superadmin Dashboard</span>
            </Link>
          </div>
        )}

        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {activeTab === 'overview' ? 'Manager Dashboard & Lead Assignment' : 'Sales Agents Management'}
            </h1>
            <p className="text-xs text-slate-400">Strictly real-time property inquiries and verified team metrics</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>+ Add Manual Lead</span>
            </button>
            <button
              onClick={() => setShowAddAgentModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Agent Account</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6 animate-fade-in">
              {/* =============================================================
                  1. OVERVIEW SECTION / REAL STATS CARDS
                  ============================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Total Inbound Leads */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Total Inbound Leads</span>
                  <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {stats.totalLeads}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Inquiries from Home Page</span>
                </div>

                {/* Card 2: Unassigned Leads */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-amber-600">Unassigned Leads</span>
                  <div className="text-3xl font-black text-amber-600 mt-2 font-mono">
                    {stats.unassignedLeads}
                  </div>
                  <span className="text-[11px] text-amber-700/80 mt-1 block font-medium">Needs Agent Assignment</span>
                </div>

                {/* Card 3: Assigned Leads */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-blue-600">Assigned Leads</span>
                  <div className="text-3xl font-black text-blue-600 mt-2 font-mono">
                    {stats.assignedLeads}
                  </div>
                  <span className="text-[11px] text-blue-700/80 mt-1 block font-medium">Handled by Sales Agents</span>
                </div>

                {/* Card 4: Active Agents */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-emerald-600">Active Sales Agents</span>
                  <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">
                    {stats.activeAgents}
                  </div>
                  <span className="text-[11px] text-emerald-700/80 mt-1 block font-medium">Ready for Lead Assignment</span>
                </div>
              </div>

              {/* =============================================================
                  2. CLEAN & RELEVANT GRAPH: LEAD STATUS DISTRIBUTION
                  ============================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>Lead Progression & Status Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-500">Live breakdown of customer inquiries progressing across sales stages</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> New</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Site Visits</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Closed Deals</span>
                  </div>
                </div>

                {stats.totalLeads === 0 ? (
                  <div className="h-52 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No Lead Inquiries Recorded</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Inquiries submitted on the public Home Page will automatically populate here in real-time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left: Recharts Bar Chart (8 cols) */}
                    <div className="lg:col-span-8 h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={leadStatusDistribution} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
                                    {payload[0].payload.name}: {payload[0].value} leads
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={38}>
                            {leadStatusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Right: Quick Stage Summaries (4 cols) */}
                    <div className="lg:col-span-4 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="font-bold text-slate-700">Stage Progression</span>
                        <span className="font-bold text-slate-500 font-mono">{stats.totalLeads} Total</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                            New Inquiries
                          </span>
                          <span className="font-bold text-slate-900 font-mono">{stats.newLeads}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            In Progress / Contacted
                          </span>
                          <span className="font-bold text-slate-900 font-mono">{stats.inProgressLeads}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Site Visits Scheduled
                          </span>
                          <span className="font-bold text-slate-900 font-mono">{stats.siteVisitsScheduled}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Deals Closed
                          </span>
                          <span className="font-bold text-emerald-700 font-mono">{stats.dealsClosed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =============================================================
                  3. LEADS MANAGEMENT TABLE (QUEUE & ASSIGNMENT)
                  ============================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeadFilter('unassigned')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        leadFilter === 'unassigned' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Unassigned Queue ({unassignedLeads.length})
                    </button>
                    <button
                      onClick={() => setLeadFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        leadFilter === 'all' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All Inquiries ({allLeads.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddLeadModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition cursor-pointer border border-blue-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Manual Lead</span>
                    </button>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search inquiries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 sm:w-56"
                      />
                    </div>
                  </div>
                </div>

                {displayedLeads.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    {leadFilter === 'unassigned'
                      ? 'No unassigned leads! All incoming website inquiries have been assigned.'
                      : 'No leads found matching your search.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Client Name & Contact</th>
                          <th className="py-3 px-4">Property Requirements</th>
                          <th className="py-3 px-4">Budget Range</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Assign To Agent</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedLeads.map((l) => (
                          <tr key={l._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-900 text-xs">{l.clientName || l.name}</p>
                                {l.source && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                    {l.source}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{l.email}</span>
                                {l.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{l.phone}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <span className="font-semibold text-slate-800">{l.propertyType || 'Residential'}</span>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                {l.requirements || l.message || 'Requirements not specified'}
                              </p>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                              {l.budget || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {l.status}
                              </span>
                              {l.assignedAgent && (
                                <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                                  Agent: {l.assignedAgent.name || 'Assigned'}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={selectedAgentForAssign[l._id] || (l.assignedAgent?._id || '')}
                                onChange={(e) => setSelectedAgentForAssign({ ...selectedAgentForAssign, [l._id]: e.target.value })}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 cursor-pointer w-48"
                              >
                                <option value="">Select Agent...</option>
                                {agents.map((ag) => (
                                  <option key={ag._id} value={ag.userId || ag._id}>
                                    {ag.name} ({ag.role || 'Agent'})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleAssignLead(l._id)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 ml-auto"
                              >
                                <Send className="w-3 h-3" />
                                <span>{l.assignedAgent ? 'Reassign' : 'Assign'}</span>
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
          ) : (
            /* =============================================================
                4. AGENT MANAGEMENT VIEW
                ============================================================= */
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Registered Real Estate Agents</h3>
                    <p className="text-xs text-slate-500">Manage agents and check their active assigned property inquiries</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <button
                      onClick={() => setShowAddAgentModal(true)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create Agent</span>
                    </button>
                  </div>
                </div>

                {filteredAgents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No agents registered yet. Click "+ Create Agent" to create the first agent account.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Agent Name</th>
                          <th className="py-3 px-4">Contact Details</th>
                          <th className="py-3 px-4">Assigned Leads</th>
                          <th className="py-3 px-4">Role & Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAgents.map((ag) => (
                          <tr key={ag._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <p>{ag.name}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <p>{ag.email}</p>
                              <p className="text-[11px] text-slate-400">{ag.phone || 'No phone'}</p>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                {ag.activeLeadsCount || 0} Leads
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {ag.role || 'Real Estate Agent'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteAgent(ag._id, ag.name)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                                title="Remove Agent"
                              >
                                <Trash2 className="w-4 h-4" />
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

      {/* CREATE AGENT MODAL */}
      {showAddAgentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Create Real Estate Agent Account</h3>
                <p className="text-[11px] text-slate-400">Agent will receive login credentials to view assigned property leads</p>
              </div>
              <button
                onClick={() => {
                  setShowAddAgentModal(false)
                  setAgentModalError('')
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAgentSubmit} className="p-6 space-y-3.5 text-xs">
              {agentModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center justify-between animate-fade-in">
                  <span>{agentModalError}</span>
                  <button
                    type="button"
                    onClick={() => setAgentModalError('')}
                    className="p-1 text-rose-400 hover:text-rose-700 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agent Full Name *</label>
                <input
                  type="text"
                  required
                  value={agentForm.name}
                  onChange={(e) => {
                    setAgentModalError('')
                    setAgentForm({ ...agentForm, name: e.target.value })
                  }}
                  placeholder="e.g. Michael Harris"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={agentForm.email}
                    onChange={(e) => {
                      setAgentModalError('')
                      setAgentForm({ ...agentForm, email: e.target.value })
                    }}
                    placeholder="michael@crm.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Unique email required</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={agentForm.password}
                    onChange={(e) => {
                      setAgentModalError('')
                      setAgentForm({ ...agentForm, password: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={agentForm.phone}
                    onChange={(e) => {
                      setAgentModalError('')
                      setAgentForm({ ...agentForm, phone: e.target.value })
                    }}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={agentForm.role}
                    onChange={(e) => {
                      setAgentModalError('')
                      setAgentForm({ ...agentForm, role: e.target.value })
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAgentModal(false)
                    setAgentModalError('')
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAgent}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-xs"
                >
                  {submittingAgent ? 'Creating Agent...' : 'Create Agent Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL LEAD ENTRY MODAL */}
      <ManualLeadModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onLeadCreated={handleLeadCreated}
        agents={agents}
      />
    </div>
  )
}

export default ManagerDashboard
