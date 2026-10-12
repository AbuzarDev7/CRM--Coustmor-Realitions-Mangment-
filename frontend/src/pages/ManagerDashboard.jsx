import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  LogOut,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  X,
  AlertCircle,
  RefreshCw,
  Award
} from 'lucide-react'
import { API_BASE_URL, MANAGER_API_URL } from '../config/api'

const ManagerDashboard = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Dashboard Data State
  const [stats, setStats] = useState({
    teamAgents: { value: 0, formatted: '0 Members', label: 'Sales Reps & Support' },
    activeDeals: { value: 0, formatted: '0 Deals', label: 'In Active Pipeline' },
    teamRevenue: { value: 0, formatted: '$0', target: '$150,000', label: 'Monthly Quota Progress' },
    teamWinRate: { value: 85, formatted: '85%', label: 'Average Success Rate' }
  })
  const [agents, setAgents] = useState([])
  const [recentDeals, setRecentDeals] = useState([])

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State for adding Sales Agent / Staff
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Sales Agent',
    category: 'agent',
    phone: '',
    monthlyQuota: 35000,
    password: 'Agent@1234'
  })

  // Toast Helper
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
        const parsed = JSON.parse(storedUser)
        setCurrentUser(parsed)
      } catch (e) {
        console.error(e)
      }
    }

    fetchManagerData()
  }, [navigate])

  // Fetch strictly manager data from backend API
  const fetchManagerData = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('crm_token')
      const headers = {
        'Content-Type': 'application/json'
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${MANAGER_API_URL}/dashboard`, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch manager data: ${res.statusText}`)
      }

      const data = await res.json()
      if (data.success) {
        if (data.stats) setStats(data.stats)
        if (data.agents) setAgents(data.agents)
        if (data.recentDeals) setRecentDeals(data.recentDeals)
      }
    } catch (err) {
      console.warn('API error, using local fallback if available:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  };

  // Add Sales Agent or Staff Member handler
  const handleAddAgent = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and work email are required!')
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${MANAGER_API_URL}/agents`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add agent')
      }

      showToast(`Success: ${formData.category === 'staff' ? 'Staff member' : 'Sales Agent'} added!`)
      setShowAddModal(false)
      setFormData({
        name: '',
        email: '',
        role: 'Sales Agent',
        category: 'agent',
        phone: '',
        monthlyQuota: 35000,
        password: 'Agent@1234'
      })
      // Refresh dashboard list
      fetchManagerData()
    } catch (err) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remove Agent Handler
  const handleDeleteAgent = async (agentId, agentName) => {
    if (!window.confirm(`Are you sure you want to remove ${agentName} from the team?`)) {
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

      if (!res.ok) {
        throw new Error('Failed to remove agent')
      }

      showToast(`${agentName} has been removed from the team.`)
      fetchManagerData()
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    navigate('/login')
  }

  // Filter agents by search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents
    const query = searchQuery.toLowerCase()
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.role.toLowerCase().includes(query)
    )
  }, [agents, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar strictly tailored for Manager */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-violet-500/25">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">Onesoft</span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                Manager Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Team Management & Sales Oversight</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={fetchManagerData}
            title="Refresh Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-violet-600' : ''}`} />
          </button>

          {/* Quick link for Super Admin to toggle back */}
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'engineer') && (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-600 bg-slate-100 hover:bg-violet-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-violet-600" />
              <span>Super Admin View</span>
            </Link>
          )}

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Manager Profile & Logout */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-600/10 text-violet-700 font-bold flex items-center justify-center text-xs border border-violet-200">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'Sales Manager'}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">{currentUser?.email || 'manager@onesoft.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome & Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Team Overview & Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Add and manage your Sales Agents and Support Staff, monitor deal pipelines, and track team targets.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-violet-500/25 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Sales Agent / Staff</span>
          </button>
        </div>

        {/* 4 Strictly Necessary Team KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Team Strength */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Strength</span>
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.teamAgents.formatted}</span>
              <p className="text-xs text-slate-500 mt-0.5">{stats.teamAgents.label}</p>
            </div>
          </div>

          {/* Card 2: Active Pipeline Deals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deals</span>
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.activeDeals.formatted}</span>
              <p className="text-xs text-slate-500 mt-0.5">{stats.activeDeals.label}</p>
            </div>
          </div>

          {/* Card 3: Monthly Team Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Closed Revenue</span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.teamRevenue.formatted}</span>
              <p className="text-xs text-slate-500 mt-0.5">Target: {stats.teamRevenue.target}</p>
            </div>
          </div>

          {/* Card 4: Team Win Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Win Rate</span>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.teamWinRate.formatted}</span>
              <p className="text-xs text-slate-500 mt-0.5">{stats.teamWinRate.label}</p>
            </div>
          </div>
        </div>

        {/* Sales Agents & Staff Roster Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Sales Agents & Staff Members</span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {filteredAgents.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Staff and sales personnel under your direct supervision</p>
            </div>

            {/* Filter Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agent by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member Name & Email</th>
                  <th className="py-3 px-4">Position / Role</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Deals Closed</th>
                  <th className="py-3 px-4 text-right">Closed Value</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No sales agents or staff found. Click "+ Add Sales Agent / Staff" above to add your first member.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent._id || agent.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={agent.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{agent.name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {agent.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{agent.role}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            agent.category === 'staff'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-violet-50 text-violet-700 border border-violet-200'
                          }`}
                        >
                          {agent.category === 'staff' ? 'Support Staff' : 'Sales Agent'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">{agent.dealsClosed || 0}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        ${(agent.totalValue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-900">{agent.successRate || 85}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            agent.status === 'Online'
                              ? 'bg-emerald-50 text-emerald-700'
                              : agent.status === 'In Meeting'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              agent.status === 'Online'
                                ? 'bg-emerald-500'
                                : agent.status === 'In Meeting'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {agent.status || 'Online'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAgent(agent._id || agent.id, agent.name)}
                          title="Remove from team"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Pipeline Deals Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Deals in Pipeline</h2>
              <p className="text-xs text-slate-500">Key ongoing client deals managed by your sales team</p>
            </div>
            <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
              {recentDeals.length} Deals Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentDeals.length === 0 ? (
              <p className="col-span-full text-center py-6 text-xs text-slate-400">No active deals registered yet.</p>
            ) : (
              recentDeals.map((deal) => (
                <div key={deal._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 text-xs line-clamp-1">{deal.title}</p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        deal.stage === 'Closed Won'
                          ? 'bg-emerald-100 text-emerald-800'
                          : deal.stage === 'Negotiation'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-violet-100 text-violet-800'
                      }`}
                    >
                      {deal.stage}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between text-xs">
                    <span className="text-sm font-black text-slate-900">${(deal.amount || 0).toLocaleString()}</span>
                    <span className="text-[11px] text-slate-500">{deal.probability || 50}% probability</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal: + Add Sales Agent / Staff (Manager Permission) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Add Sales Agent or Staff</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manager Authorization - Create new team member</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asad Farooq"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. asad@onesoft.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Member Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value
                      setFormData({
                        ...formData,
                        category: cat,
                        role: cat === 'staff' ? 'Support Staff' : 'Sales Agent'
                      })
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 focus:outline-none"
                  >
                    <option value="agent">Sales Agent</option>
                    <option value="staff">Staff / Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Position / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Sales Rep"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Sales Quota ($)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    value={formData.monthlyQuota}
                    onChange={(e) => setFormData({ ...formData, monthlyQuota: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 300 0000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password (for member login)</label>
                <input
                  type="text"
                  placeholder="Agent@1234"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default login password for the agent to access assigned leads.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl shadow-md shadow-violet-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Confirm & Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerDashboard
