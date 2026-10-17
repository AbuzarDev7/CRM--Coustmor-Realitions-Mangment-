import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Layers,
  Sparkles,
  X,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  LogOut,
  Plus,
  MessageSquare,
  Search,
  Building,
  CalendarCheck,
  Award,
  Settings,
  User,
  Lock,
  Shield,
  Bell,
  Save,
  KeyRound,
  Check,
  CheckCircle
} from 'lucide-react'
import { AGENT_API_URL, LEADS_API_URL, AUTH_API_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'

const REAL_ESTATE_STATUSES = [
  'New',
  'Contacted',
  'Site Visit Scheduled',
  'Deal Closed'
]

const AgentDashboard = () => {
  const navigate = useNavigate()
  const { user: authUser, logout: authLogout } = useAuth()
  const [currentUser, setCurrentUser] = useState(authUser || null)

  // Sub-views: 'leads' | 'settings'
  const [activeTab, setActiveTab] = useState('leads')
  const [leads, setLeads] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Settings State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Real Estate Sales Agent',
    department: 'Residential Real Estate'
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')

  // Preferences State
  const [preferences, setPreferences] = useState({
    notifyNewLeads: true,
    dailyDigest: true,
    soundAlerts: true
  })

  // Follow-up Note Modal
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedLeadForNote, setSelectedLeadForNote] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

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

  // Fetch strictly assigned leads for this agent
  const fetchAgentLeads = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // 1. Fetch strictly assigned leads (GET /api/agent/my-leads)
      const res = await fetch(`${AGENT_API_URL}/my-leads`, {
        headers,
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        const assignedLeads = data.leads || []
        setLeads(assignedLeads)
        if (data.agent) {
          setCurrentUser((prev) => ({ ...prev, ...data.agent }))
        }
      }
    } catch (err) {
      console.warn('Agent fetch error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentLeads()
  }, [])

  // Sync profile form when user loads
  useEffect(() => {
    if (currentUser) {
      setProfileForm((prev) => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || 'Real Estate Sales Agent',
        department: currentUser.department || 'Residential Real Estate'
      }))
    }
  }, [currentUser])

  // Save Agent Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${AUTH_API_URL}/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          email: profileForm.email.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      const updatedUser = {
        ...currentUser,
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim()
      }

      setCurrentUser(updatedUser)
      localStorage.setItem('crm_user', JSON.stringify(updatedUser))
      showToast('Agent profile updated successfully!')
    } catch (err) {
      showToast(err.message || 'Error updating profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Update Password
  const handleSavePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg('')

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg('New password must be at least 6 characters')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg('Passwords do not match')
      return
    }

    setSavingPassword(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showToast('Security password updated successfully!')
    } catch (err) {
      setPasswordMsg(err.message || 'Error updating password')
    } finally {
      setSavingPassword(false)
    }
  }

  // Inline Lead Status Change (PUT /api/leads/update/:leadId)
  const handleLeadStatusChange = async (leadId, newStatus) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
    )
    showToast(`Lead status updated to '${newStatus}'!`)

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${LEADS_API_URL}/update/${leadId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })
    } catch (err) {
      console.warn('Status update error:', err.message)
    }
  }

  // Submit Follow-up Note (PUT /api/leads/update/:leadId)
  const handleAddNoteSubmit = async (e) => {
    e.preventDefault()
    if (!noteText.trim() || !selectedLeadForNote) return

    setSubmittingNote(true)
    const leadId = selectedLeadForNote._id

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${LEADS_API_URL}/update/${leadId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ note: noteText.trim() })
      })

      const data = await res.json()
      if (data.lead) {
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? data.lead : l))
        )
        setSelectedLeadForNote(data.lead)
      }

      showToast('Follow-up note logged successfully!')
      setNoteText('')
      setShowNoteModal(false)
    } catch (err) {
      showToast('Error logging note')
    } finally {
      setSubmittingNote(false)
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

  // Filtered leads for search
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads
    const q = searchQuery.toLowerCase()
    return leads.filter(
      (l) =>
        (l.clientName && l.clientName.toLowerCase().includes(q)) ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.propertyType && l.propertyType.toLowerCase().includes(q)) ||
        (l.requirements && l.requirements.toLowerCase().includes(q))
    )
  }, [leads, searchQuery])

  // Real Counts calculated strictly from the agent's assigned leads
  const stats = useMemo(() => {
    const total = leads.length
    const newCount = leads.filter((l) => l.status === 'New').length
    const contactedCount = leads.filter((l) => l.status === 'Contacted').length
    const siteVisitsCount = leads.filter((l) => l.status === 'Site Visit Scheduled').length
    const closedCount = leads.filter((l) => l.status === 'Deal Closed' || l.status === 'Closed').length
    return { total, newCount, contactedCount, siteVisitsCount, closedCount }
  }, [leads])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 antialiased">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full z-30">
        <div>
          {/* Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200">
            <Link to="/" className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm shadow-violet-500/20">
              <Building className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">Property CRM</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 block">Agent Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                activeTab === 'leads' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>My Assigned Leads</span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'leads' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                activeTab === 'settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Agent Settings</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">Agent {currentUser?.name || 'Sales Agent'}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'agent@crm.com'}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
              activeTab === 'settings' ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Profile & Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                {activeTab === 'leads' ? `Hello, Agent ${currentUser?.name || 'Sales Agent'} 👋` : 'Agent Account & Security Settings'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                Sales Specialist
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeTab === 'leads'
                ? 'Strictly property inquiries assigned to you by the Management team'
                : 'Manage your personal details, contact information, and security preferences'}
            </p>
          </div>

          {activeTab === 'leads' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search my leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 w-56 sm:w-64"
              />
            </div>
          )}
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === 'leads' && (
            <>
              {/* Status Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500">Total Assigned Leads</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {stats.total}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-violet-600">Contacted / Progress</span>
              <div className="text-2xl font-black text-violet-700 mt-1 font-mono">
                {stats.contactedCount}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-600">Site Visits Scheduled</span>
              <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                {stats.siteVisitsCount}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600">Deals Closed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                {stats.closedCount}
              </div>
            </div>
          </div>

          {/* Assigned Leads Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Assigned Inquiries List</h3>
                <p className="text-xs text-slate-500">Contact the client, schedule property visits, update statuses, and log notes</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
              </span>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No assigned leads found. Leads assigned to you by the Manager will appear here automatically.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Contact Details</th>
                      <th className="py-3 px-4">Property Requirements</th>
                      <th className="py-3 px-4 text-right">Budget Range</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Follow-up Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 text-xs">{lead.clientName || lead.name}</p>
                          {lead.propertyType && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold text-[10px]">
                              {lead.propertyType}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1 hover:text-violet-600 transition"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{lead.email}</span>
                          </a>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-violet-600 transition mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone}</span>
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-xs text-slate-700 line-clamp-2" title={lead.requirements || lead.message}>
                            {lead.requirements || lead.message || 'Requirements not specified'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {lead.budget || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={lead.status}
                            onChange={(e) => handleLeadStatusChange(lead._id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer ${
                              lead.status === 'Site Visit Scheduled'
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : lead.status === 'Contacted'
                                ? 'bg-violet-50 text-violet-700 border-violet-300'
                                : lead.status === 'Deal Closed' || lead.status === 'Closed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            {REAL_ESTATE_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedLeadForNote(lead)
                              setShowNoteModal(true)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs transition cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Notes ({lead.notes?.length || 0})</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Agent Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Agent Overview Profile Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-full bg-violet-500/10 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                  {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{currentUser?.name || 'Sales Agent'}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-400/20 text-violet-300 border border-violet-400/30">
                      Active Agent
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{currentUser?.email || 'agent@crm.com'}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                    <span>Role: Real Estate Sales Specialist</span>
                    <span>•</span>
                    <span>Department: Residential Real Estate</span>
                  </div>
                </div>
              </div>

              {/* Quick KPIs in Banner */}
              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 min-w-[110px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Leads</span>
                  <div className="text-lg font-black text-white mt-0.5 font-mono">{stats.total}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 min-w-[110px]">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Deals Closed</span>
                  <div className="text-lg font-black text-emerald-300 mt-0.5 font-mono">{stats.closedCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Forms Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">Update your contact profile visible to management</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. Sufyan Khan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. +92 300 1234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. agent@company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Role</label>
                    <input
                      type="text"
                      value={profileForm.role}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 text-xs cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={profileForm.department}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 text-xs cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Security & Preferences */}
            <div className="space-y-6">
              {/* Security & Password Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Security & Password</h3>
                    <p className="text-xs text-slate-500">Update your account login credentials</p>
                  </div>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  {passwordMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium">
                      {passwordMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                        placeholder="Min. 6 chars"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {savingPassword ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification & Alerts Preferences Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Notification Alerts</h3>
                    <p className="text-xs text-slate-500">Configure how you receive lead assignment updates</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                    <div>
                      <span className="text-xs font-bold text-slate-800">New Lead Assignment Alerts</span>
                      <p className="text-[11px] text-slate-400">Receive instant notifications when manager assigns a new property inquiry</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyNewLeads}
                      onChange={(e) => {
                        setPreferences({ ...preferences, notifyNewLeads: e.target.checked })
                        showToast('Notification preferences updated')
                      }}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Daily Site Visits Schedule</span>
                      <p className="text-[11px] text-slate-400">Receive a daily morning reminder of all scheduled client visits</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.dailyDigest}
                      onChange={(e) => {
                        setPreferences({ ...preferences, dailyDigest: e.target.checked })
                        showToast('Daily schedule preference updated')
                      }}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                    <div>
                      <span className="text-xs font-bold text-slate-800">In-App Audio Notification</span>
                      <p className="text-[11px] text-slate-400">Play an alert chime when customer or manager updates an inquiry</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.soundAlerts}
                      onChange={(e) => {
                        setPreferences({ ...preferences, soundAlerts: e.target.checked })
                        showToast('Audio alerts preference updated')
                      }}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>

      {/* FOLLOW-UP NOTES MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Lead Follow-up Notes: {selectedLeadForNote?.clientName || selectedLeadForNote?.name}
                </h3>
                <p className="text-[11px] text-slate-400">Log customer call notes, visit feedback, and inquiries</p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Existing Note History */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] block uppercase tracking-wider">
                  Previous Notes History ({selectedLeadForNote?.notes?.length || 0}):
                </span>
                {(!selectedLeadForNote?.notes || selectedLeadForNote.notes.length === 0) ? (
                  <p className="text-slate-400 text-xs py-2 italic">No notes logged for this client yet.</p>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                    {selectedLeadForNote.notes.map((n, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs">
                        <p className="text-slate-800 leading-relaxed">{n.text}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {n.date ? new Date(n.date).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Note Form */}
              <form onSubmit={handleAddNoteSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Add New Follow-up Note *</label>
                  <textarea
                    rows={3}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Contacted client, discussed villa requirements, scheduled visit for Saturday at 3 PM..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submittingNote}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-xs"
                  >
                    {submittingNote ? 'Saving Note...' : 'Save Follow-up Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentDashboard
