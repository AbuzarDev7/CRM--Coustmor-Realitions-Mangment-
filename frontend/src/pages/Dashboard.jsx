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
  Building,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  Search,
  TrendingUp,
  BarChart3,
  Settings,
  UserCheck,
  FileText,
  Filter,
  Eye
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
import { ADMIN_API_URL, COMPANIES_API_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'
import ManualLeadModal from '../components/ManualLeadModal'
import AdminSettingsWidget from '../components/AdminSettingsWidget'
import CreateCompanyModal from '../components/CreateCompanyModal'
import EditCompanyModal from '../components/EditCompanyModal'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user: authUser, logout: authLogout } = useAuth()
  const [user, setUser] = useState(authUser || null)

  const userRole = (user?.role || '').toLowerCase().trim()
  const isSuperAdmin = userRole === 'superadmin' || userRole === 'admin'
  const isCompanyAdmin = userRole === 'company_admin'

  // Sub-tabs: 'companies' | 'overview' | 'managers' | 'agents' | 'leads' | 'settings'
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'companies' : 'overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // SaaS Companies state
  const [companies, setCompanies] = useState([])
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false)
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all')
  const [companyTypeFilter, setCompanyTypeFilter] = useState('all')
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all')
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  // Real database states
  const [stats, setStats] = useState({
    totalLeads: 0,
    unassignedLeads: 0,
    totalManagers: 0,
    totalAgents: 0
  })
  const [leadStatusDistribution, setLeadStatusDistribution] = useState([
    { name: 'New Leads', count: 0, fill: '#8b5cf6' },
    { name: 'In Progress', count: 0, fill: '#3b82f6' },
    { name: 'Site Visits', count: 0, fill: '#f59e0b' },
    { name: 'Deals Closed', count: 0, fill: '#10b981' }
  ])
  const [managers, setManagers] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [allLeads, setAllLeads] = useState([])
  const [agents, setAgents] = useState([])

  // Search and Filter states
  const [leadSourceFilter, setLeadSourceFilter] = useState('all')
  const [leadStatusFilter, setLeadStatusFilter] = useState('all')
  const [leadSearchQuery, setLeadSearchQuery] = useState('')
  const [agentSearchQuery, setAgentSearchQuery] = useState('')

  // Modal State for Manual Lead Entry & Manager Creation
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [showAddManagerModal, setShowAddManagerModal] = useState(false)
  const [submittingManager, setSubmittingManager] = useState(false)
  const [managerForm, setManagerForm] = useState({
    name: '',
    email: '',
    password: 'Manager@1234',
    phone: '',
    department: 'Residential Real Estate',
    monthlyQuota: 100000
  })

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('crm_user', JSON.stringify(updatedUser))
    showToast('Super Admin profile updated successfully!')
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Load user session
  useEffect(() => {
    if (authUser) {
      setUser(authUser)
    } else {
      const stored = localStorage.getItem('crm_user')
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [authUser])

  // Fetch real statistics, managers, and recent leads
  const fetchSuperAdminData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // 1. Fetch live overview stats & lead status distribution
      const statsRes = await fetch(`${ADMIN_API_URL}/dashboard/stats`, {
        headers,
        credentials: 'include'
      })
      if (statsRes.ok) {
        const data = await statsRes.json()
        if (data.stats) {
          setStats((prev) => ({
            ...prev,
            totalLeads: typeof data.stats.totalLeads === 'number' ? data.stats.totalLeads : (data.stats.totalLeads?.raw || 0),
            unassignedLeads: typeof data.stats.unassignedLeads === 'number' ? data.stats.unassignedLeads : (data.summary?.unassignedLeads || 0),
            totalManagers: typeof data.stats.totalManagers === 'number' ? data.stats.totalManagers : prev.totalManagers,
            totalAgents: typeof data.stats.totalAgents === 'number' ? data.stats.totalAgents : prev.totalAgents
          }))
        }
        if (data.leadStatusDistribution && Array.isArray(data.leadStatusDistribution)) {
          setLeadStatusDistribution(data.leadStatusDistribution)
        }
        if (data.managers && Array.isArray(data.managers)) {
          setManagers(data.managers)
        }
        if (data.recentLeads && Array.isArray(data.recentLeads)) {
          setRecentLeads(data.recentLeads)
        }
      }

      // 2. Fetch managers roster (ensures sync)
      const mgrRes = await fetch(`${ADMIN_API_URL}/managers`, {
        headers,
        credentials: 'include'
      })
      if (mgrRes.ok) {
        const mgrData = await mgrRes.json()
        const mgrList = mgrData.managers || []
        if (mgrList.length > 0) {
          setManagers(mgrList)
          setStats((prev) => ({
            ...prev,
            totalManagers: mgrList.length
          }))
        }
      }

      // 3. Fetch agents roster count & list
      const staffRes = await fetch(`${ADMIN_API_URL}/staff`, {
        headers,
        credentials: 'include'
      })
      if (staffRes.ok) {
        const staffData = await staffRes.json()
        const staffList = staffData.staff || []
        setAgents(staffList)
        setStats((prev) => ({
          ...prev,
          totalAgents: staffList.length
        }))
      }

      // 4. Fetch recent inquiries from DB
      const leadsRes = await fetch(`${ADMIN_API_URL}/leads`, {
        headers,
        credentials: 'include'
      })
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json()
        const leadsList = leadsData.leads || []
        if (leadsList.length > 0) {
          setRecentLeads(leadsList)
          setAllLeads(leadsList)
          setStats((prev) => ({
            ...prev,
            totalLeads: leadsList.length,
            unassignedLeads: leadsList.filter((l) => !l.assignedAgent || l.status === 'New').length
          }))
        }
      }
      // 5. Fetch Companies (SaaS Multi-Company Architecture)
      const compRes = await fetch(COMPANIES_API_URL, {
        headers,
        credentials: 'include'
      })
      if (compRes.ok) {
        const compData = await compRes.json()
        const compList = compData.companies || []
        setCompanies(compList)
      }
    } catch (err) {
      console.warn('Super Admin fetch error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuperAdminData()
  }, [])

  // Callback when a company is created by Superadmin
  const handleCompanyCreated = (newCompany) => {
    showToast(`Company '${newCompany.companyName}' and Company Admin created!`)
    fetchSuperAdminData()
  }

  // Callback when a company is edited by Superadmin
  const handleCompanyUpdated = (updatedCompany) => {
    showToast(`Company '${updatedCompany.companyName}' settings updated!`)
    setCompanies((prev) =>
      prev.map((c) => (c._id === updatedCompany._id ? { ...c, ...updatedCompany } : c))
    )
  }

  // Toggle company status (active / suspended / inactive)
  const handleToggleCompanyStatus = async (companyId, newStatus) => {
    try {
      setStatusUpdatingId(companyId)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${COMPANIES_API_URL}/${companyId}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update company status')
      }

      setCompanies((prev) =>
        prev.map((c) => (c._id === companyId ? { ...c, status: newStatus } : c))
      )
      showToast(`Company status set to '${newStatus}'`)
    } catch (err) {
      showToast(err.message || 'Status update failed')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  // Callback when a manual lead is created
  const handleLeadCreated = (newLead) => {
    showToast(`Lead '${newLead.clientName}' added successfully from ${newLead.source}!`)
    fetchSuperAdminData()
  }

  // Create Manager Account (Superadmin Control)
  const handleAddManagerSubmit = async (e) => {
    e.preventDefault()
    setSubmittingManager(true)

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${ADMIN_API_URL}/managers`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(managerForm)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create manager account')
      }

      showToast(`Manager '${managerForm.name}' created successfully!`)
      setShowAddManagerModal(false)
      setManagerForm({
        name: '',
        email: '',
        password: 'Manager@1234',
        phone: '',
        department: 'Residential Real Estate',
        monthlyQuota: 100000
      })
      fetchSuperAdminData()
    } catch (err) {
      showToast(err.message || 'Error creating manager')
    } finally {
      setSubmittingManager(false)
    }
  }

  // Delete Manager
  const handleDeleteManager = async (managerId, managerName) => {
    if (!window.confirm(`Are you sure you want to remove Manager '${managerName}'?`)) {
      return
    }

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${ADMIN_API_URL}/managers/${managerId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      if (res.ok) {
        showToast(`Manager '${managerName}' removed.`)
        fetchSuperAdminData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to delete manager')
      }
    } catch (err) {
      showToast(err.message || 'Error deleting manager')
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

  // Filtered managers for search
  const filteredManagers = useMemo(() => {
    if (!searchQuery.trim()) return managers
    const q = searchQuery.toLowerCase()
    return managers.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q))
    )
  }, [managers, searchQuery])

  // Filtered agents for search
  const filteredAgents = useMemo(() => {
    if (!agentSearchQuery.trim()) return agents
    const q = agentSearchQuery.toLowerCase()
    return agents.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.role && a.role.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q))
    )
  }, [agents, agentSearchQuery])

  // Filtered companies for search & filter
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (companyStatusFilter !== 'all' && c.status !== companyStatusFilter) return false
      if (companyTypeFilter !== 'all' && c.businessType !== companyTypeFilter) return false
      if (companySearchQuery.trim()) {
        const q = companySearchQuery.toLowerCase()
        const name = (c.companyName || '').toLowerCase()
        const ownerName = (c.owner?.name || '').toLowerCase()
        const ownerEmail = (c.owner?.email || '').toLowerCase()
        return name.includes(q) || ownerName.includes(q) || ownerEmail.includes(q)
      }
      return true
    })
  }, [companies, companySearchQuery, companyStatusFilter, companyTypeFilter])

  // Filtered leads for search, source filter, and company filter
  const filteredLeads = useMemo(() => {
    const list = allLeads.length > 0 ? allLeads : recentLeads
    return list.filter((lead) => {
      // Company tenant filter
      if (selectedCompanyFilter !== 'all') {
        const leadComp = lead.company?._id || lead.company
        if (String(leadComp) !== String(selectedCompanyFilter)) return false
      }
      // Channel / source filter
      if (leadSourceFilter !== 'all') {
        const src = (lead.source || '').toLowerCase()
        if (leadSourceFilter === 'facebook' && !src.includes('facebook')) return false
        if (leadSourceFilter === 'instagram' && !src.includes('instagram')) return false
        if (leadSourceFilter === 'whatsapp' && !src.includes('whatsapp')) return false
        if (leadSourceFilter === 'direct call' && !src.includes('call') && !src.includes('manual')) return false
        if (leadSourceFilter === 'website' && !src.includes('website')) return false
      }
      // Status filter
      if (leadStatusFilter !== 'all') {
        if ((lead.status || '').toLowerCase() !== leadStatusFilter.toLowerCase()) return false
      }
      // Search query
      if (leadSearchQuery.trim()) {
        const q = leadSearchQuery.toLowerCase()
        const name = (lead.clientName || lead.name || '').toLowerCase()
        const email = (lead.email || '').toLowerCase()
        const phone = (lead.phone || '').toLowerCase()
        const req = (lead.requirements || lead.message || '').toLowerCase()
        return name.includes(q) || email.includes(q) || phone.includes(q) || req.includes(q)
      }
      return true
    })
  }, [allLeads, recentLeads, selectedCompanyFilter, leadSourceFilter, leadStatusFilter, leadSearchQuery])

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
              <ShieldCheck className="w-5 h-5" />
            </Link>
            <div>
              <span className="font-extrabold text-slate-900 text-sm block">Property CRM</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 block">Super Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            {isSuperAdmin ? (
              /* Superadmin Strictly Limited to Company & Tenant Management (No leads, managers, or sales) */
              <>
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeTab === 'companies'
                      ? 'bg-violet-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Registered Companies</span>
                  <span
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTab === 'companies' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-800'
                    }`}
                  >
                    {companies.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeTab === 'settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Superadmin Settings</span>
                </button>
              </>
            ) : (
              /* Company Admin Navigation */
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeTab === 'overview' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Company Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab('managers')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeTab === 'managers' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Managers</span>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {managers.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('agents')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeTab === 'agents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Sales Agents</span>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {agents.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('leads')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeTab === 'leads' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Company Leads</span>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {allLeads.length > 0 ? allLeads.length : stats.totalLeads}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                    activeTab === 'settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Company Settings</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                Admin {user?.name || user?.username || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@crm.com'}</p>
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
                Hello, Admin {user?.name || user?.username || 'Administrator'} 👋
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700">
                Root Access
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeTab === 'companies' && 'SaaS Tenant companies & dedicated Company Admin owners'}
              {activeTab === 'overview' && 'System overview & live database metrics'}
              {activeTab === 'managers' && 'Branch Manager accounts & quota management'}
              {activeTab === 'agents' && 'All sales agents roster across branches'}
              {activeTab === 'leads' && 'Complete inbound leads queue & marketing channel sources'}
              {activeTab === 'settings' && 'Superadmin account settings & system preferences'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin ? (
              <button
                onClick={() => setShowCreateCompanyModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 transition cursor-pointer"
              >
                <Building className="w-4 h-4" />
                <span>+ Create Company & Admin</span>
              </button>
            ) : (
              <>
                <Link
                  to="/manager-dashboard"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs shadow-xs transition cursor-pointer"
                  title="Open and oversee Manager Dashboard with full oversight"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>View Manager Dashboard</span>
                </Link>
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-violet-400" />
                  <span>+ Add Manual Lead</span>
                </button>
                <button
                  onClick={() => setShowAddManagerModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Manager</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* TAB 0: SAAS MULTI-COMPANY TENANTS */}
          {activeTab === 'companies' && (
            <div className="space-y-6 animate-fade-in">
              {/* SaaS Top Metric Cards - Strictly Tenant Focused */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Registered Companies</span>
                    <Building className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {companies.length}
                  </div>
                  <span className="text-[11px] text-violet-600 mt-1 block">Active SaaS Client Tenants</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Active Workspaces</span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">
                    {companies.filter((c) => c.status === 'active').length}
                  </div>
                  <span className="text-[11px] text-emerald-600/80 mt-1 block">Operational Status</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Industry Categories</span>
                    <Layers className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-blue-700 mt-2 font-mono">
                    {new Set(companies.map((c) => c.businessType || c.industryType).filter(Boolean)).size || 1}
                  </div>
                  <span className="text-[11px] text-blue-600/80 mt-1 block">Configured Business Types</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Suspended / Inactive</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-amber-700 mt-2 font-mono">
                    {companies.filter((c) => c.status !== 'active').length}
                  </div>
                  <span className="text-[11px] text-amber-600/80 mt-1 block">Requires Administrator Review</span>
                </div>
              </div>

              {/* Company Management Card & Controls */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-violet-600" />
                      <span>Company Accounts & Independent Tenants</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Create and manage company workspaces, provision Company Admins, and monitor data isolation.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateCompanyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 transition cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Provision New Company & Admin</span>
                  </button>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search company name, admin name, or email..."
                      value={companySearchQuery}
                      onChange={(e) => setCompanySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
                    <select
                      value={companyTypeFilter}
                      onChange={(e) => setCompanyTypeFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    >
                      <option value="all">All Industries</option>
                      <option value="real_estate">Real Estate</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="automotive">Automotive</option>
                      <option value="services">Services</option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>

                    <select
                      value={companyStatusFilter}
                      onChange={(e) => setCompanyStatusFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Companies Grid / Roster */}
                {filteredCompanies.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-800">No Companies Found</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {companySearchQuery || companyStatusFilter !== 'all' || companyTypeFilter !== 'all'
                        ? 'No companies match your search criteria. Try resetting the filters.'
                        : 'No independent company accounts have been registered yet. Create your first company to get started.'}
                    </p>
                    <button
                      onClick={() => setShowCreateCompanyModal(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Provision First Company</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCompanies.map((c) => {
                      const typeLabel =
                        c.businessType === 'real_estate'
                          ? '🏢 Real Estate'
                          : c.businessType === 'restaurant'
                          ? '🍽️ Restaurant'
                          : c.businessType === 'automotive'
                          ? '🚗 Automotive'
                          : c.businessType === 'services'
                          ? '💼 Services'
                          : c.businessType === 'retail'
                          ? '🛍️ Retail'
                          : '🌐 Enterprise'

                      return (
                        <div
                          key={c._id}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                                  {c.companyName}
                                </h4>
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {typeLabel}
                                </span>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                                  c.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : c.status === 'suspended'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    c.status === 'active'
                                      ? 'bg-emerald-500'
                                      : c.status === 'suspended'
                                      ? 'bg-rose-500'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                <span>{c.status}</span>
                              </span>
                            </div>

                            {/* Company Admin (Owner) Details Box */}
                            <div className="mt-3.5 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Company Admin (Owner)
                              </span>
                              <div className="font-bold text-slate-900 truncate">
                                {c.owner?.name || c.contactEmail || 'Admin User'}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{c.owner?.email || c.contactEmail}</span>
                              </div>
                              {c.contactPhone && (
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{c.contactPhone}</span>
                                </div>
                              )}
                            </div>

                            {/* Public Form URL Link */}
                            <div className="mt-2.5 px-3 py-2 bg-violet-50/70 border border-violet-100 rounded-xl flex items-center justify-between text-[11px]">
                              <div className="min-w-0 pr-2">
                                <span className="text-[10px] text-violet-600 font-bold block">Public Tenant Lead Form:</span>
                                <span className="font-mono text-slate-700 truncate block text-[10px]">
                                  /form/{c.companySlug || c._id}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  const url = `${window.location.origin}/form/${c.companySlug || c._id}`
                                  navigator.clipboard.writeText(url)
                                  showToast(`Copied public URL: ${url}`)
                                }}
                                className="px-2 py-1 rounded-lg bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 font-bold text-[10px] shrink-0 cursor-pointer shadow-2xs"
                                title="Copy public link to share with clients or embed in website"
                              >
                                Copy Link
                              </button>
                            </div>

                            {/* Company Tenant Meta Strip */}
                            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="font-semibold text-slate-400">Slug:</span>
                                <span className="font-mono text-slate-700 font-bold">{c.companySlug || 'default'}</span>
                              </span>
                              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                {c.address ? c.address.slice(0, 20) : 'Workspace Tenant'}
                              </span>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <a
                              href={`/form/${c.companySlug || c._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition text-center cursor-pointer shrink-0"
                              title="Preview public inquiry form in new tab"
                            >
                              Public Form ↗
                            </a>

                            <button
                              onClick={() => {
                                setEditingCompany(c)
                                setShowEditCompanyModal(true)
                              }}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-[11px] transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                              title="Edit company name, industry type, and tenant settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>Edit Settings</span>
                            </button>

                            {c.status === 'active' ? (
                              <button
                                disabled={statusUpdatingId === c._id}
                                onClick={() => handleToggleCompanyStatus(c._id, 'suspended')}
                                className="py-1.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
                                title="Suspend this tenant account"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                disabled={statusUpdatingId === c._id}
                                onClick={() => handleToggleCompanyStatus(c._id, 'active')}
                                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer disabled:opacity-50"
                                title="Reactivate this tenant account"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* 4 Essential Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Total Property Inquiries</span>
                  <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {stats.totalLeads}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Submitted from Home Page</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Unassigned Inquiries</span>
                  <div className="text-3xl font-black text-amber-600 mt-2 font-mono">
                    {stats.unassignedLeads}
                  </div>
                  <span className="text-[11px] text-amber-600/80 mt-1 block">Awaiting Manager Assignment</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Active Branch Managers</span>
                  <div className="text-3xl font-black text-violet-700 mt-2 font-mono">
                    {stats.totalManagers}
                  </div>
                  <span className="text-[11px] text-violet-600/80 mt-1 block">Authorized Manager Accounts</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Registered Sales Agents</span>
                  <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">
                    {stats.totalAgents}
                  </div>
                  <span className="text-[11px] text-emerald-600/80 mt-1 block">Managed by Branch Managers</span>
                </div>
              </div>

              {/* Lead Progression & Status Distribution Chart */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                      <span>System-wide Lead Progression & Status Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-500">Live breakdown of website customer inquiries progressing across sales stages</p>
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
                            cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
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
                        <span className="font-bold text-slate-700">Stage Breakdown</span>
                        <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full font-mono">
                          {stats.totalLeads} Total
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                            <span>New Inquiries</span>
                          </span>
                          <span className="font-bold font-mono text-slate-900">
                            {leadStatusDistribution.find((d) => d.name === 'New Leads')?.count || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>In Progress / Follow-up</span>
                          </span>
                          <span className="font-bold font-mono text-slate-900">
                            {leadStatusDistribution.find((d) => d.name === 'In Progress')?.count || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Site Visits Scheduled</span>
                          </span>
                          <span className="font-bold font-mono text-slate-900">
                            {leadStatusDistribution.find((d) => d.name === 'Site Visits')?.count || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Closed & Converted</span>
                          </span>
                          <span className="font-bold font-mono text-emerald-700">
                            {leadStatusDistribution.find((d) => d.name === 'Deals Closed')?.count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Real Inbound Leads Flow */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Recent Property Inquiries</h3>
                    <p className="text-xs text-slate-500">Live incoming leads submitted directly by website visitors & manual campaigns</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAddLeadModal(true)}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Manual Lead</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('managers')}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      Manage Managers →
                    </button>
                  </div>
                </div>

                {recentLeads.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No inquiries submitted yet. Submit a test form on the Home Page or click "+ Add Manual Lead".</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Client Name</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Requirements & Property</th>
                          <th className="py-3 px-4">Budget</th>
                          <th className="py-3 px-4">Assigned Agent</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentLeads.slice(0, 10).map((l) => (
                          <tr key={l._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900">{l.clientName || l.name}</span>
                                {l.source && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                    {l.source}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{l.email}</div>
                              <div className="text-[11px] text-slate-400">{l.phone || 'No phone'}</div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <span className="font-semibold text-slate-800">{l.propertyType || 'Residential'}</span>
                              <p className="text-[11px] text-slate-500 truncate">{l.requirements || l.message || 'Requirements pending'}</p>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {l.budget || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {l.assignedAgent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{l.assignedAgent.name || 'Assigned'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                                  <Clock className="w-3 h-3" />
                                  <span>Unassigned</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {l.status}
                              </span>
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

          {/* TAB 2: MANAGER ACCOUNTS MANAGEMENT */}
          {activeTab === 'managers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Authorized Branch Managers</h3>
                    <p className="text-xs text-slate-500">Managers have permission to create Agent accounts and assign incoming leads</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search managers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>

                    <button
                      onClick={() => setShowAddManagerModal(true)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Manager</span>
                    </button>
                  </div>
                </div>

                {filteredManagers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No manager accounts registered yet. Click "+ Add Manager" above.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Manager Profile</th>
                          <th className="py-3 px-4">Contact Details</th>
                          <th className="py-3 px-4">Branch / Department</th>
                          <th className="py-3 px-4 text-right">Target Quota</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredManagers.map((mgr) => (
                          <tr key={mgr._id || mgr.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 text-xs">{mgr.name}</p>
                              <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full bg-violet-50 text-violet-700 font-semibold text-[10px]">
                                {mgr.role || 'Sales Manager'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <p>{mgr.email}</p>
                              <p className="text-[11px] text-slate-400">{mgr.phone || 'No phone'}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {mgr.department || 'Sales Management'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ${(mgr.monthlyQuota || 100000).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteManager(mgr._id || mgr.id, mgr.name)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                                title="Remove Manager"
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

          {/* TAB 3: SALES AGENTS ROSTER (ALL AGENTS ACROSS ALL BRANCHES) */}
          {activeTab === 'agents' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-violet-600" />
                      <span>Sales Agents Directory ({filteredAgents.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">Superadmin oversight of all active sales agents managed across branch teams</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search agents by name, email, or department..."
                        value={agentSearchQuery}
                        onChange={(e) => setAgentSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 w-64"
                      />
                    </div>
                  </div>
                </div>

                {filteredAgents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No sales agents found. Branch managers create and manage agents from their dashboard.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Agent Profile</th>
                          <th className="py-3 px-4">Contact Details</th>
                          <th className="py-3 px-4">Role & Department</th>
                          <th className="py-3 px-4 text-center">Deals Closed</th>
                          <th className="py-3 px-4 text-right">Target Quota</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAgents.map((ag) => (
                          <tr key={ag._id || ag.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                  {ag.name ? ag.name[0].toUpperCase() : 'A'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{ag.name}</p>
                                  <span className="text-[10px] text-slate-400">Sales Representative</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <p>{ag.email}</p>
                              <p className="text-[11px] text-slate-400">{ag.phone || 'No phone'}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              <p className="text-slate-900 font-semibold">{ag.role || 'Sales Agent'}</p>
                              <p className="text-[11px] text-slate-400">{ag.department || 'Residential Sales'}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {ag.dealsClosed ?? 0} Closed
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              ${(ag.monthlyQuota || 50000).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{ag.status || 'Active'}</span>
                              </span>
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

          {/* TAB 4: ALL PROPERTY LEADS (INSPECTION & PIPELINE) */}
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-600" />
                      <span>All Inbound Property Leads Pipeline</span>
                    </h3>
                    <p className="text-xs text-slate-500">Live feed across Website, Meta Ads, WhatsApp, and Direct Phone Call channels</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowAddLeadModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Manual Lead</span>
                    </button>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search leads by name, email, requirements..."
                        value={leadSearchQuery}
                        onChange={(e) => setLeadSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 w-56 sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Company Tenant Filter (Superadmin Global View) */}
                {isSuperAdmin && companies.length > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs">
                    <Building className="w-4 h-4 text-violet-600 shrink-0" />
                    <span className="font-bold text-violet-900 shrink-0">Filter by Company:</span>
                    <select
                      value={selectedCompanyFilter}
                      onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-violet-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    >
                      <option value="all">🏢 All Companies (Universal Queue)</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.companyName} ({c.businessType})
                        </option>
                      ))}
                    </select>
                    {selectedCompanyFilter !== 'all' && (
                      <button
                        onClick={() => setSelectedCompanyFilter('all')}
                        className="text-[11px] font-bold text-violet-600 hover:text-violet-800 underline ml-2 cursor-pointer"
                      >
                        Reset to All
                      </button>
                    )}
                  </div>
                )}

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Channel:</span>
                  {['all', 'website', 'facebook', 'instagram', 'whatsapp', 'direct call'].map((channel) => (
                    <button
                      key={channel}
                      onClick={() => setLeadSourceFilter(channel)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize transition cursor-pointer shrink-0 ${
                        leadSourceFilter === channel
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {channel === 'direct call' ? 'Calls / Walk-in' : channel}
                    </button>
                  ))}
                </div>

                {filteredLeads.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No leads matching your current filters. Click "+ Add Manual Lead" above to record a new inquiry.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Client Name & Channel</th>
                          {isSuperAdmin && <th className="py-3 px-4">Company</th>}
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Property Requirements</th>
                          <th className="py-3 px-4">Budget</th>
                          <th className="py-3 px-4">Assigned Agent</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLeads.map((l) => (
                          <tr key={l._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 text-xs">{l.clientName || l.name}</p>
                              <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                                {l.source || 'Website'}
                              </span>
                            </td>
                            {isSuperAdmin && (
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-700 text-xs">
                                  {l.company?.companyName || (typeof l.company === 'string' ? l.company.slice(0, 8) + '...' : 'System Tenant')}
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-4 text-slate-600">
                              <p>{l.email}</p>
                              <p className="text-[11px] text-slate-400">{l.phone || 'No phone'}</p>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <span className="font-semibold text-slate-800">{l.propertyType || 'Residential'}</span>
                              <p className="text-[11px] text-slate-500 truncate">{l.requirements || l.message || 'Requirements pending'}</p>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                              {l.budget || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {l.assignedAgent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{l.assignedAgent.name || 'Assigned'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                                  <Clock className="w-3 h-3" />
                                  <span>Unassigned</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {l.status}
                              </span>
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

          {/* TAB 5: ADMIN SETTINGS & PROFILE */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <AdminSettingsWidget
                user={user}
                showToast={showToast}
                onUserUpdated={handleUserUpdated}
              />
            </div>
          )}
        </main>
      </div>

      {/* CREATE MANAGER MODAL */}
      {showAddManagerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Create Branch Manager Account</h3>
                <p className="text-[11px] text-slate-400">Managers receive incoming leads and manage agents</p>
              </div>
              <button
                onClick={() => setShowAddManagerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManagerSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={managerForm.name}
                  onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                  placeholder="e.g. David Sterling"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={managerForm.email}
                    onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                    placeholder="david@crm.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={managerForm.password}
                    onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={managerForm.phone}
                    onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Target Quota ($)</label>
                  <input
                    type="number"
                    value={managerForm.monthlyQuota}
                    onChange={(e) => setManagerForm({ ...managerForm, monthlyQuota: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department / Branch</label>
                <input
                  type="text"
                  value={managerForm.department}
                  onChange={(e) => setManagerForm({ ...managerForm, department: e.target.value })}
                  placeholder="e.g. Luxury Residential Division"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddManagerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManager}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-xs"
                >
                  {submittingManager ? 'Creating Manager...' : 'Create Manager Account'}
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

      {/* SAAS COMPANY & ADMIN PROVISIONING MODAL */}
      <CreateCompanyModal
        isOpen={showCreateCompanyModal}
        onClose={() => setShowCreateCompanyModal(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      {/* EDIT SAAS COMPANY SETTINGS MODAL */}
      <EditCompanyModal
        isOpen={showEditCompanyModal}
        onClose={() => {
          setShowEditCompanyModal(false)
          setEditingCompany(null)
        }}
        company={editingCompany}
        onCompanyUpdated={(updated) => {
          setCompanies((prev) =>
            prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c))
          )
          showToast(`Successfully updated settings for ${updated.companyName}`)
        }}
      />
    </div>
  )
}

export default Dashboard
