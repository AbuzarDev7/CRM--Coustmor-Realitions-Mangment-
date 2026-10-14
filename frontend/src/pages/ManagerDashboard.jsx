import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import {
  Users, User,
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
  Video,
  X,
  AlertCircle,
  RefreshCw,
  Award,
  Clock,
  Check,
  DollarSign,
  UserPlus,
  FileCheck,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  Lock,
  Unlock,
  AlertTriangle,
  MessageSquare,
  Smile,
  Meh,
  Frown,
  FileText,
  Eye,
  Sparkles,
  Settings,
  Bell,
  Calendar,
  Building,
  CheckSquare,
  BarChart3,
  Sliders,
  Flame,
  Rocket,
  LayoutDashboard
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { API_BASE_URL, MANAGER_API_URL, CHAT_API_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'
import ImpersonationBanner from '../components/ImpersonationBanner'
import ChatTranscriptModal from '../components/ChatTranscriptModal'
import ProfileAvatarUploader from '../components/ProfileAvatarUploader'

// Pipeline Value Over Time chart data matching reference curve
const pipelineOverTimeData = [
  { date: 'Apr 1', value: 0 },
  { date: 'Apr 4', value: 550000 },
  { date: 'Apr 8', value: 920000 },
  { date: 'Apr 11', value: 1400000 },
  { date: 'Apr 15', value: 1250000 },
  { date: 'Apr 18', value: 1800000 },
  { date: 'Apr 22', value: 1650000 },
  { date: 'Apr 25', value: 2100000 },
  { date: 'Apr 29', value: 2450000, peak: true, label: '$2.45M Apr 29' }
]

// Fallback recent deal activities
const defaultActivities = [
  { id: 1, title: 'Acme Corp deal moved to Proposal', author: 'Sarah Johnson', time: '2h ago', type: 'proposal' },
  { id: 2, title: 'Follow-up call with TechNova', author: 'Michael Brown', time: '5h ago', type: 'call' },
  { id: 3, title: 'BluePeak deal moved to Negotiation', author: 'Emily Davis', time: '1d ago', type: 'negotiation' },
  { id: 4, title: 'Contract sent to NextGen Solutions', author: 'John Smith', time: '1d ago', type: 'contract' },
  { id: 5, title: 'New lead Global Enterprises added', author: 'Sarah Johnson', time: '2d ago', type: 'lead' }
]

// Upcoming customer consultation / meeting schedule
const upcomingFollowUps = [
  { id: 1, dateMonth: 'MAY', dateDay: '20', title: 'Call with Acme Corp', person: 'Sarah Johnson', time: '10:00 AM', type: 'call' },
  { id: 2, dateMonth: 'MAY', dateDay: '21', title: 'Demo with TechNova', person: 'Michael Brown', time: '1:30 PM', type: 'demo' },
  { id: 3, dateMonth: 'MAY', dateDay: '22', title: 'Proposal Review', person: 'Emily Davis', time: '11:00 AM', type: 'meeting' },
  { id: 4, dateMonth: 'MAY', dateDay: '23', title: 'Follow-up with BluePeak', person: 'John Smith', time: '3:00 PM', type: 'call' }
]

// Key Decision Maker Top Contacts
const defaultTopContacts = [
  { id: 1, name: 'Alex Johnson', title: 'CTO', company: 'Acme Corp', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 2, name: 'Priya Sharma', title: 'Head of Ops', company: 'TechNova', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80' },
  { id: 3, name: 'David Lee', title: 'Sales Director', company: 'BluePeak', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 4, name: 'Jessica Miller', title: 'Marketing Head', company: 'BrightWave', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' },
  { id: 5, name: 'Daniel Kim', title: 'CEO', company: 'NextGen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
]

const ManagerDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user: authUser, logout: authLogout, updateUser } = useAuth()

  // Inspection params from query
  const targetManagerId = searchParams.get('managerId')
  const targetManagerEmail = searchParams.get('managerEmail')
  const paramManagerName = searchParams.get('managerName')

  // Auth User State
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Permission Guard State (for Super Admin inspection mode)
  const [isReadOnly, setIsReadOnly] = useState(false)

  // Manager Profile Info (Dynamic from database)
  const [managerProfile, setManagerProfile] = useState(
    paramManagerName || targetManagerEmail
      ? {
          name: paramManagerName || 'John Smith',
          email: targetManagerEmail || 'manager@crm.com',
          role: 'Sales Manager',
          department: 'Sales Management',
          monthlyQuota: 100000,
          avatar: ''
        }
      : null
  )
  const [notFound, setNotFound] = useState(false)

  // Live Database Stats
  const [stats, setStats] = useState({
    totalLeads: { count: 2486, formatted: '2,486', change: '↑ 18.6% vs last month' },
    openDeals: { count: 156, formatted: '156', change: '↑ 12.4% vs last month' },
    revenueForecast: { value: 2450000, formatted: '$2.45M', change: '↑ 22.7% vs last month' },
    conversionRate: { value: 24.8, formatted: '24.8%', change: '↑ 6.3% vs last month' },
    teamTargetProgress: { current: 0, target: 100000, percentage: 0, formattedCurrent: '$0', formattedTarget: '$100,000' },
    unassignedLeads: { count: 0, formatted: '0 Leads', label: 'Awaiting Rep Assignment' },
    activeTeamDeals: { value: 0, count: 0, formatted: '$0', label: '0 In Active Pipeline' },
    pendingApprovals: { count: 0, formatted: '0 Requests', label: 'Discount & Quote Approvals' },
    pipelineStages: [
      { name: 'New Lead', count: 320, value: 320000, formattedValue: '$320K', color: '#38bdf8' },
      { name: 'Qualified', count: 210, value: 540000, formattedValue: '$540K', color: '#06b6d4' },
      { name: 'Proposal', count: 98, value: 680000, formattedValue: '$680K', color: '#f59e0b' },
      { name: 'Negotiation', count: 52, value: 430000, formattedValue: '$430K', color: '#f97316' },
      { name: 'Closed Won', count: 34, value: 480000, formattedValue: '$480K', color: '#8b5cf6' }
    ],
    totalPipelineValue: '$2.45M'
  })

  // Team Roster & Leads from DB
  const [agents, setAgents] = useState([])
  const [unassignedLeads, setUnassignedLeads] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [recentDeals, setRecentDeals] = useState([])

  // Navigation tab: 'dashboard' | 'leads' | 'deals' | 'reports' | 'tasks' | 'settings'
  const [activeNav, setActiveNav] = useState('dashboard')

  // Top header states
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [timeRange, setTimeRange] = useState('This Month')

  // Sub-views Interactive States (Deals, Contacts, Companies, Tasks, Analytics)
  const [dealStageFilter, setDealStageFilter] = useState('all')
  const [dealSearchQuery, setDealSearchQuery] = useState('')
  const [dealsList, setDealsList] = useState([
    { id: 1, title: 'Acme Enterprise Cloud Migration', company: 'Acme Corp', value: 120000, stage: 'Proposal', probability: 75, rep: 'Sarah Johnson', closeDate: '2026-11-15' },
    { id: 2, title: 'TechNova AI Infrastructure Expansion', company: 'TechNova Systems', value: 85000, stage: 'Negotiation', probability: 90, rep: 'Michael Brown', closeDate: '2026-10-30' },
    { id: 3, title: 'BluePeak Global License Renewal', company: 'BluePeak Software', value: 64000, stage: 'Qualified', probability: 60, rep: 'Emily Davis', closeDate: '2026-12-01' },
    { id: 4, title: 'BrightWave Marketing Automation Hub', company: 'BrightWave Media', value: 45000, stage: 'Closed Won', probability: 100, rep: 'John Smith', closeDate: '2026-10-10' },
    { id: 5, title: 'NextGen Cybersecurity Fleet Package', company: 'NextGen Cloud', value: 180000, stage: 'New Lead', probability: 40, rep: 'Sarah Johnson', closeDate: '2026-12-20' },
    { id: 6, title: 'Vertex Analytics On-Premises Tier', company: 'Vertex Dynamics', value: 95000, stage: 'Negotiation', probability: 85, rep: 'Michael Brown', closeDate: '2026-11-05' }
  ])

  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [contactFilter, setContactFilter] = useState('all')
  const [contactsList, setContactsList] = useState([
    { id: 1, name: 'Alex Johnson', title: 'Chief Technology Officer', company: 'Acme Corp', email: 'alex@acme.com', phone: '+1 (555) 234-8901', rep: 'Sarah Johnson', status: 'Active Client', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { id: 2, name: 'Priya Sharma', title: 'VP of Operations', company: 'TechNova Systems', email: 'priya@technova.io', phone: '+1 (555) 456-1122', rep: 'Michael Brown', status: 'In Negotiation', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80' },
    { id: 3, name: 'David Lee', title: 'Global Sales Director', company: 'BluePeak Software', email: 'david@bluepeak.net', phone: '+1 (555) 789-3344', rep: 'Emily Davis', status: 'Qualified Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { id: 4, name: 'Jessica Miller', title: 'Head of Growth Marketing', company: 'BrightWave Media', email: 'jessica@brightwave.co', phone: '+1 (555) 654-9988', rep: 'John Smith', status: 'Active Client', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' },
    { id: 5, name: 'Daniel Kim', title: 'Chief Executive Officer', company: 'NextGen Cloud', email: 'daniel@nextgen.org', phone: '+1 (555) 321-4455', rep: 'Sarah Johnson', status: 'New Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
    { id: 6, name: 'Elena Rostova', title: 'Procurement Specialist', company: 'Vertex Dynamics', email: 'elena@vertex.com', phone: '+1 (555) 876-5544', rep: 'Michael Brown', status: 'In Negotiation', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' }
  ])

  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [companyIndustryFilter, setCompanyIndustryFilter] = useState('all')
  const [companiesList, setCompaniesList] = useState([
    { id: 1, name: 'Acme Corp', industry: 'Enterprise SaaS', size: '500-1000 employees', location: 'New York, USA', openDeals: 2, totalValue: 185000, keyContact: 'Alex Johnson', status: 'Strategic Account' },
    { id: 2, name: 'TechNova Systems', industry: 'Cloud & AI Infrastructure', size: '200-500 employees', location: 'San Francisco, USA', openDeals: 1, totalValue: 85000, keyContact: 'Priya Sharma', status: 'Active Enterprise' },
    { id: 3, name: 'BluePeak Software', industry: 'FinTech & Payments', size: '50-200 employees', location: 'London, UK', openDeals: 1, totalValue: 64000, keyContact: 'David Lee', status: 'Growth Account' },
    { id: 4, name: 'BrightWave Media', industry: 'Digital Advertising', size: '100-250 employees', location: 'Austin, USA', openDeals: 1, totalValue: 45000, keyContact: 'Jessica Miller', status: 'Key Client' },
    { id: 5, name: 'NextGen Cloud', industry: 'Cybersecurity', size: '1000+ employees', location: 'Seattle, USA', openDeals: 2, totalValue: 240000, keyContact: 'Daniel Kim', status: 'Strategic Account' },
    { id: 6, name: 'Vertex Dynamics', industry: 'Consulting & Analytics', size: '50-100 employees', location: 'Toronto, Canada', openDeals: 1, totalValue: 95000, keyContact: 'Elena Rostova', status: 'Active Enterprise' }
  ])

  const [taskFilter, setTaskFilter] = useState('all')
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const [taskList, setTaskList] = useState([
    { id: 1, title: 'Call with Acme Corp CTO regarding Q4 cloud roadmap', rep: 'Sarah Johnson', dueDate: 'Today, 2:00 PM', priority: 'High', completed: false, company: 'Acme Corp' },
    { id: 2, title: 'Demo with TechNova security & architecture team', rep: 'Michael Brown', dueDate: 'Tomorrow, 11:30 AM', priority: 'High', completed: false, company: 'TechNova Systems' },
    { id: 3, title: 'Send revised SLA proposal to BluePeak management', rep: 'Emily Davis', dueDate: 'Oct 22, 4:00 PM', priority: 'Medium', completed: false, company: 'BluePeak Software' },
    { id: 4, title: 'Executive follow-up call with NextGen procurement', rep: 'Sarah Johnson', dueDate: 'Oct 24, 10:00 AM', priority: 'Medium', completed: true, company: 'NextGen Cloud' },
    { id: 5, title: 'Quarterly review check-in with BrightWave', rep: 'John Smith', dueDate: 'Oct 25, 3:00 PM', priority: 'Low', completed: true, company: 'BrightWave Media' }
  ])

  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskRep, setNewTaskRep] = useState('Sarah Johnson')
  const [newTaskCompany, setNewTaskCompany] = useState('Acme Corp')
  const [newTaskPriority, setNewTaskPriority] = useState('Medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('Tomorrow, 2:00 PM')

  const handleToggleTask = (id) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
    showToast('Task status updated!')
  }

  const handleCreateTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    const created = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      rep: newTaskRep,
      company: newTaskCompany,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      completed: false
    }
    setTaskList((prev) => [created, ...prev])
    setNewTaskTitle('')
    setShowNewTaskModal(false)
    showToast('New team follow-up scheduled!')
  }

  const handleMoveDealStage = (id, newStage) => {
    setDealsList((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage: newStage, probability: newStage === 'Closed Won' ? 100 : newStage === 'Closed Lost' ? 0 : d.probability } : d))
    )
    showToast('Deal stage updated successfully!')
  }

  // Filtered computed values
  const filteredDeals = dealsList.filter((d) => {
    const matchStage = dealStageFilter === 'all' || d.stage === dealStageFilter
    const matchSearch = !dealSearchQuery.trim() ||
      d.title.toLowerCase().includes(dealSearchQuery.toLowerCase()) ||
      d.company.toLowerCase().includes(dealSearchQuery.toLowerCase()) ||
      d.rep.toLowerCase().includes(dealSearchQuery.toLowerCase())
    return matchStage && matchSearch
  })

  const filteredContacts = contactsList.filter((c) => {
    const matchFilter = contactFilter === 'all' || c.status === contactFilter
    const matchSearch = !contactSearchQuery.trim() ||
      c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  const filteredCompanies = companiesList.filter((cmp) => {
    const matchInd = companyIndustryFilter === 'all' || cmp.industry === companyIndustryFilter
    const matchSearch = !companySearchQuery.trim() ||
      cmp.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
      cmp.industry.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
      cmp.location.toLowerCase().includes(companySearchQuery.toLowerCase())
    return matchInd && matchSearch
  })

  const filteredTasks = taskList.filter((t) => {
    const matchFilter =
      taskFilter === 'all' ||
      (taskFilter === 'pending' && !t.completed) ||
      (taskFilter === 'completed' && t.completed) ||
      (taskFilter === 'high' && t.priority === 'High')
    const matchSearch = !taskSearchQuery.trim() ||
      t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.company.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.rep.toLowerCase().includes(taskSearchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

    // Selected agent for assignment
  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState({})

  // Add Agent Modal
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

  // Chat Quality Audits & Manager Reports State
  const [chatReports, setChatReports] = useState([])
  const [chatKpis, setChatKpis] = useState({
    totalReports: 0,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    positiveRate: 0,
    resolvedCount: 0,
    escalatedCount: 0,
    pendingFollowUpCount: 0
  })
  const [loadingChatReports, setLoadingChatReports] = useState(false)
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(null)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [chatSentimentFilter, setChatSentimentFilter] = useState('all')
  const [chatResolutionFilter, setChatResolutionFilter] = useState('all')
  const [chatSearchQuery, setChatSearchQuery] = useState('')

  // Determine if viewer is Super Admin in inspection mode
  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
  const isInspecting = isSuperAdmin && (Boolean(targetManagerId) || Boolean(targetManagerEmail) || searchParams.get('impersonate') === 'true')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3800)
  }

  // Load Session
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
  }, [navigate])

  // Fetch Manager Dashboard Data
  useEffect(() => {
    fetchDashboardData()
  }, [targetManagerId, targetManagerEmail])

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const queryParams = new URLSearchParams()
      if (targetManagerId) queryParams.set('managerId', targetManagerId)
      if (targetManagerEmail) queryParams.set('managerEmail', targetManagerEmail)

      const url = `${MANAGER_API_URL}/dashboard?${queryParams.toString()}`
      const res = await fetch(url, { headers, credentials: 'include' })

      if (res.status === 404) {
        setNotFound(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        throw new Error(`Failed to load manager dashboard: ${res.statusText}`)
      }

      const data = await res.json()
      if (data.manager) setManagerProfile(data.manager)
      if (data.stats) {
        setStats((prev) => ({
          ...prev,
          ...data.stats
        }))
      }
      if (data.agents) setAgents(data.agents)
      if (data.unassignedLeads) setUnassignedLeads(data.unassignedLeads)
      if (data.recentLeads) setRecentLeads(data.recentLeads)
      if (data.pendingApprovals) setPendingApprovals(data.pendingApprovals)
      if (data.recentDeals) setRecentDeals(data.recentDeals)
    } catch (err) {
      console.warn('Manager Dashboard sync notice:', err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch Quality Audit Reports
  const fetchChatReports = async () => {
    try {
      setLoadingChatReports(true)
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const params = new URLSearchParams()
      if (chatSentimentFilter !== 'all') params.set('sentiment', chatSentimentFilter)
      if (chatResolutionFilter !== 'all') params.set('resolutionStatus', chatResolutionFilter)
      if (chatSearchQuery.trim()) params.set('search', chatSearchQuery.trim())

      const res = await fetch(`${CHAT_API_URL}/manager/reports?${params.toString()}`, {
        headers,
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        setChatReports(data.reports || [])
        if (data.kpis) setChatKpis(data.kpis)
      }
    } catch (err) {
      console.warn('Failed to fetch chat audit reports:', err)
    } finally {
      setLoadingChatReports(false)
    }
  }

  useEffect(() => {
    if (activeNav === 'reports') {
      fetchChatReports()
    }
  }, [activeNav, chatSentimentFilter, chatResolutionFilter])

  // Assign lead to sales agent
  const handleAssignLead = async (leadId) => {
    const agentId = selectedAgentForAssign[leadId]
    if (!agentId) {
      showToast('Please select a sales representative')
      return
    }

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${MANAGER_API_URL}/leads/${leadId}/assign`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ agentId })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign lead')

      showToast(`Lead assigned to ${data.assignedTo?.name || 'Agent'}!`)
      fetchDashboardData()
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Add Sales Agent Submit
  const handleAddAgent = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and email are required')
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
        body: JSON.stringify({
          ...formData,
          managerEmail: managerProfile?.email || '',
          managerId: managerProfile?.id || ''
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add agent')

      showToast(`Success: Sales Agent ${formData.name} added to your team!`)
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
      await fetchDashboardData()
    } catch (err) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' })
    } catch (e) {
      console.error(e)
    } finally {
      if (authLogout) authLogout()
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
      navigate('/login')
    }
  }

  // Live Reps Roster for Team Performance Card
  const repList = useMemo(() => {
    if (agents.length > 0) {
      return agents.map((ag) => {
        const val = ag.totalValue || 25000
        const quota = ag.monthlyQuota || 35000
        const pct = quota > 0 ? Math.round((val / quota) * 100) : 100
        return {
          id: ag._id,
          name: ag.name,
          avatar: ag.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          valueFormatted: `$${(val / 1000).toFixed(0)}K`,
          percentage: pct
        }
      })
    }
    // Baseline matching image reference
    return [
      { id: '1', name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', valueFormatted: '$620K', percentage: 120 },
      { id: '2', name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', valueFormatted: '$510K', percentage: 98 },
      { id: '3', name: 'Michael Brown', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', valueFormatted: '$430K', percentage: 86 },
      { id: '4', name: 'Emily Davis', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80', valueFormatted: '$390K', percentage: 78 }
    ]
  }, [agents])

  // Live Recent Leads for Bottom Column
  const displayLeads = useMemo(() => {
    const list = recentLeads.length > 0 ? recentLeads : unassignedLeads
    if (list.length > 0) {
      return list.slice(0, 5).map((l, idx) => {
        const letters = ['G', 'T', 'B', 'I', 'V', 'N', 'A']
        const colors = [
          'bg-emerald-50 text-emerald-700 border-emerald-200',
          'bg-teal-50 text-teal-700 border-teal-200',
          'bg-amber-50 text-amber-700 border-amber-200',
          'bg-indigo-50 text-indigo-700 border-indigo-200',
          'bg-purple-50 text-purple-700 border-purple-200'
        ]
        return {
          id: l._id || idx,
          name: l.company || l.name,
          industry: l.source || 'IT Services & Cloud',
          time: '2h ago',
          badgeLetter: (l.company || l.name || 'L')[0].toUpperCase(),
          badgeColor: colors[idx % colors.length]
        }
      })
    }
    return [
      { id: 1, name: 'Global Enterprises', industry: 'Manufacturing', time: '2h ago', badgeLetter: 'G', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { id: 2, name: 'TechNova Solutions', industry: 'IT Services', time: '5h ago', badgeLetter: 'T', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
      { id: 3, name: 'BrightWave Inc.', industry: 'Marketing', time: '1d ago', badgeLetter: 'B', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
      { id: 4, name: 'Innovatech Labs', industry: 'Software', time: '2d ago', badgeLetter: 'I', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { id: 5, name: 'Vertex Dynamics', industry: 'Consulting', time: '2d ago', badgeLetter: 'V', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' }
    ]
  }, [recentLeads, unassignedLeads])

  if (loading && !managerProfile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Loading manager CRM dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#7c3aed] via-[#8b5cf6] to-[#f8fafc] p-2.5 sm:p-5 lg:p-7 flex flex-col items-center justify-start font-sans selection:bg-violet-200 selection:text-violet-900 overflow-x-hidden">
      
      {/* SIGNATURE AURORA MESH BACKGROUND ORBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[55rem] h-[55rem] bg-gradient-to-tr from-[#38bdf8]/40 via-[#818cf8]/50 to-[#c084fc]/40 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-[5%] right-[-15%] w-[50rem] h-[50rem] bg-gradient-to-bl from-[#a855f7]/50 via-[#38bdf8]/30 to-[#f472b6]/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[25%] w-[45rem] h-[25rem] bg-white/20 rounded-full blur-[90px] pointer-events-none" />
      
      {/* Impersonation Banner when Super Admin is inspecting */}
      {isInspecting && (
        <div className="w-full max-w-[1540px] mb-4">
          <ImpersonationBanner
            managerName={managerProfile?.name || paramManagerName || 'Manager'}
            isReadOnly={isReadOnly}
            onToggleReadOnly={() => setIsReadOnly(!isReadOnly)}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-semibold animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          MAIN FLOATING CRM DASHBOARD WINDOW
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-[1540px] bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-indigo-950/25 border border-white/80 overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
        
        {/* =====================================================================
            1. LEFT VERTICAL NAVIGATION SIDEBAR
            ===================================================================== */}
        <aside className="w-full md:w-[220px] shrink-0 bg-[#fafafa] border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col justify-between p-4 sm:p-5">
          
          <div className="space-y-6">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2 pl-1 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-none">
                  Onesoft
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  CRM
                </span>
              </div>
            </Link>

            {/* Navigation Menu List */}
            <nav className="space-y-1 text-xs font-semibold">
              <button
                onClick={() => setActiveNav('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'dashboard'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveNav('leads')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'leads'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Leads</span>
                </div>
                {unassignedLeads.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${activeNav === 'leads' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {unassignedLeads.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveNav('deals')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'deals'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Deals</span>
              </button>

              <button
                onClick={() => setActiveNav('contacts')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'contacts'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Contacts</span>
              </button>

              <button
                onClick={() => setActiveNav('companies')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'companies'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Companies</span>
              </button>

              <button
                onClick={() => setActiveNav('tasks')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'tasks'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks</span>
              </button>

              <button
                onClick={() => setActiveNav('reports')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'reports'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4" />
                  <span>Reports</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${activeNav === 'reports' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                  Audits
                </span>
              </button>

              <button
                onClick={() => setActiveNav('analytics')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'analytics'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveNav('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                  activeNav === 'settings'
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Bottom Card matching reference: "Upgrade to Pro" or Team Management */}
          <div className="mt-6 pt-4 border-t border-slate-200/60">
            <div className="bg-gradient-to-b from-blue-50/70 to-indigo-50/40 p-4 rounded-2xl border border-blue-100/80 text-center relative overflow-hidden">
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <Rocket className="w-5 h-5 fill-white" />
              </div>
              <p className="font-extrabold text-xs text-slate-900">Upgrade to Pro</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                Unlock advanced features and reports.
              </p>
              

            </div>
          </div>

        </aside>

        {/* =====================================================================
            2. MAIN CONTENT AREA
            ===================================================================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
          
          {/* Top Header Bar matching reference: Search, Bell (3), Envelope, User Profile */}
          <header className="px-5 sm:px-8 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-md z-30 shrink-0">
  <h1 className="text-xl font-bold text-slate-900">Onesoft CRM</h1>
  {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Right: Notifications, Envelope, User Avatar */}
            <div className="flex items-center gap-3">
              
              {/* Notification Bell with red badge '3' */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center absolute -top-0.5 -right-0.5">
                    3
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 text-xs">
                    <p className="font-bold text-slate-900 mb-2 pb-1 border-b border-slate-100">Notifications</p>
                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-900">
                        <span className="font-semibold block">New lead unassigned</span>
                        <span className="text-[10px] text-slate-500">Acme Enterprise Solutions • 10m ago</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900">
                        <span className="font-semibold block">Deal Won: $24,500</span>
                        <span className="text-[10px] text-slate-500">Multi-Agent AI Engine • 1h ago</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Envelope Message Icon */}
              <button
                onClick={() => setActiveNav('reports')}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition cursor-pointer"
                title="Agent Chat Quality Audits"
              >
                <Mail className="w-4 h-4" />
              </button>

              {/* User Profile Pill matching reference */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90 transition cursor-pointer"
                >
                  <img
                    src={managerProfile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                    alt={managerProfile?.name || 'Manager'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {managerProfile?.name || 'John Smith'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">
                      {managerProfile?.role || 'Sales Manager'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs font-semibold">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900">{managerProfile?.name || 'Manager'}</p>
                      <p className="text-[10px] text-slate-400">{managerProfile?.email || 'manager@crm.com'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveNav('settings')
                        setShowUserDropdown(false)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Manager Settings</span>
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

          {/* Sub-View Body */}
          <main className="p-4 sm:p-7 space-y-6 flex-1 min-w-0">
            
            {/* =================================================================
                MAIN DASHBOARD VIEW (MATCHING THE ATTACHED IMAGE EXACTLY)
                ================================================================= */}
            {activeNav === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* =============================================================
                    ROW 1: 4 MAIN METRIC CARDS MATCHING REFERENCE
                    ============================================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: Total Leads (Blue Circle with 2 users) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-sm transition">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Total Leads</span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                        {stats.totalLeads?.formatted || '2,486'}
                      </h3>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        {stats.totalLeads?.change || '↑ 18.6% vs last month'}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Open Deals (Teal Circle with Box/Suitcase) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-sm transition">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Open Deals</span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                        {stats.openDeals?.formatted || '156'}
                      </h3>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        {stats.openDeals?.change || '↑ 12.4% vs last month'}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Revenue Forecast (Indigo Circle with $) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-sm transition">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Revenue Forecast</span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                        {stats.revenueForecast?.formatted || '$2.45M'}
                      </h3>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        {stats.revenueForecast?.change || '↑ 22.7% vs last month'}
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Conversion Rate (Cyan Circle with Trending Chart) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-sm transition">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Conversion Rate</span>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                        {stats.conversionRate?.formatted || '24.8%'}
                      </h3>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        {stats.conversionRate?.change || '↑ 6.3% vs last month'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* =============================================================
                    ROW 2: SALES PIPELINE FUNNEL + DEAL ACTIVITY
                    ============================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Left: Sales Pipeline Card (7 cols) */}
                  <div className="lg:col-span-7 min-w-0 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Sales Pipeline</h4>
                      
                      {/* Chevron Process Bar matching reference */}
                      <div className="grid grid-cols-5 gap-1 my-5">
                        {stats.pipelineStages.map((st, i) => (
                          <div
                            key={i}
                            className="h-3.5 rounded-sm transition-all"
                            style={{ backgroundColor: st.color }}
                            title={`${st.name}: ${st.count}`}
                          />
                        ))}
                      </div>

                      {/* Stage Labels, Counts & Values matching reference */}
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {stats.pipelineStages.map((st, i) => (
                          <div key={i} className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 block truncate">
                              {st.name}
                            </span>
                            <span className="text-base font-black text-slate-900 block">
                              {st.count}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 block">
                              {st.formattedValue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                      <span className="text-slate-500 font-semibold">Total Pipeline Value</span>
                      <span className="font-black text-base text-slate-900">
                        {stats.totalPipelineValue || '$2.45M'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Deal Activity Card (5 cols) */}
                  <div className="lg:col-span-5 min-w-0 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-extrabold text-slate-900">Deal Activity</h4>
                      <button
                        onClick={() => setActiveNav('deals')}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>

                    {/* Activity List matching reference icons and styling */}
                    <div className="space-y-3">
                      {defaultActivities.map((act) => (
                        <div key={act.id} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              act.type === 'proposal' ? 'bg-blue-50 text-blue-600' :
                              act.type === 'call' ? 'bg-teal-50 text-teal-600' :
                              act.type === 'negotiation' ? 'bg-amber-50 text-amber-600' :
                              act.type === 'contract' ? 'bg-purple-50 text-purple-600' :
                              'bg-emerald-50 text-emerald-600'
                            }`}>
                              {act.type === 'call' ? <Phone className="w-3.5 h-3.5" /> :
                               act.type === 'user' || act.type === 'lead' ? <UserPlus className="w-3.5 h-3.5" /> :
                               <FileText className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate leading-tight">{act.title}</p>
                              <p className="text-[10px] text-slate-400 truncate leading-tight">by {act.author}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{act.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* =============================================================
                    ROW 3: TEAM PERFORMANCE + PIPELINE VALUE OVER TIME
                    ============================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Left: Team Performance Card (6 cols) */}
                  <div className="lg:col-span-6 min-w-0 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-extrabold text-slate-900">Team Performance</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span>{timeRange}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>

                    {/* Team Rep Roster matching reference */}
                    <div className="space-y-3.5">
                      {repList.map((rep) => (
                        <div key={rep.id} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 w-32 shrink-0">
                            <img
                              src={rep.avatar}
                              alt={rep.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <span className="font-bold text-slate-800 truncate">{rep.name}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="flex-1 mx-2">
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(rep.percentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          <span className="font-bold text-slate-900 w-14 text-right shrink-0">{rep.valueFormatted}</span>
                          <span className="font-bold text-emerald-600 text-[11px] w-10 text-right shrink-0">{rep.percentage}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Reporting to {managerProfile?.name || 'Sales Manager'}</span>
                      <button
      
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
      
                      </button>
                    </div>
                  </div>

                  {/* Right: Pipeline Value Over Time Recharts Area Chart (6 cols) */}
                  <div className="lg:col-span-6 min-w-0 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-extrabold text-slate-900">Pipeline Value Over Time</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span>{timeRange}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>

                    {/* Smooth Blue AreaChart with callout matching reference */}
                    <div className="h-56 w-full relative pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pipelineOverTimeData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickFormatter={(v) => (v === 0 ? '$0' : v >= 1000000 ? `$${v / 1000000}M` : `$${v / 1000}K`)}
                            domain={[0, 3000000]}
                            ticks={[0, 500000, 1000000, 1500000, 2500000, 3000000]}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
                                    ${(payload[0].value / 1000000).toFixed(2)}M
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorPipeline)"
                            dot={{ stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff', r: 3 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* =============================================================
                    ROW 4: THREE BOTTOM COLUMNS (RECENT LEADS, UPCOMING FOLLOW-UPS, TOP CONTACTS)
                    ============================================================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                  
                  {/* Column 1: Recent Leads */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-extrabold text-slate-900">Recent Leads</h4>
                        <button onClick={() => setActiveNav('leads')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          View All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {displayLeads.map((lead) => (
                          <div key={lead.id} className="flex items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${lead.badgeColor}`}>
                                {lead.badgeLetter}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate leading-tight">{lead.name}</p>
                                <p className="text-[10px] text-slate-400 truncate leading-tight">Industry: {lead.industry}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{lead.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Upcoming Follow-ups */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-extrabold text-slate-900">Upcoming Follow-ups</h4>
                        <button onClick={() => setActiveNav('tasks')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          View All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {upcomingFollowUps.map((task) => (
                          <div key={task.id} className="flex items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-50/80 text-blue-700 flex flex-col items-center justify-center shrink-0 border border-blue-100 leading-none">
                                <span className="text-[8px] font-bold uppercase">{task.dateMonth}</span>
                                <span className="text-xs font-black">{task.dateDay}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate leading-tight">{task.title}</p>
                                <p className="text-[10px] text-slate-400 truncate leading-tight">{task.person}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1 shrink-0">
                              {task.type === 'call' ? <Phone className="w-3 h-3 text-slate-400" /> : <Video className="w-3 h-3 text-slate-400" />}
                              <span>{task.time}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Top Contacts */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-extrabold text-slate-900">Top Contacts</h4>
                        <button onClick={() => setActiveNav('contacts')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          View All
                        </button>
                      </div>

                      <div className="space-y-3">
                        {defaultTopContacts.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={c.avatar}
                                alt={c.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate leading-tight">{c.name}</p>
                                <p className="text-[10px] text-slate-400 truncate leading-tight">{c.title}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 truncate shrink-0">
                              {c.company}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* =================================================================
                SUB-VIEW: CHAT REPORTS & QUALITY AUDITS
                ================================================================= */}
            {activeNav === 'reports' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Manager Chat Audits & Quality Reports</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Audit concluded customer-agent sessions, sentiments, and transcripts</p>
                  </div>
                  <button
                    onClick={fetchChatReports}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingChatReports ? 'animate-spin' : ''}`} />
                    <span>Refresh Audits</span>
                  </button>
                </div>

                {/* Audit KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-slate-400 font-semibold">Total Audited</span>
                    <h4 className="text-2xl font-black text-slate-900 mt-1">{chatKpis.totalReports}</h4>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-emerald-600 font-semibold">Positive Sentiment</span>
                    <h4 className="text-2xl font-black text-emerald-700 mt-1">{chatKpis.positiveRate}%</h4>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-blue-600 font-semibold">Resolved First Contact</span>
                    <h4 className="text-2xl font-black text-blue-700 mt-1">{chatKpis.resolvedCount}</h4>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-rose-500 font-semibold">Escalated to Mgmt</span>
                    <h4 className="text-2xl font-black text-rose-600 mt-1">{chatKpis.escalatedCount}</h4>
                  </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                      <select
                        value={chatSentimentFilter}
                        onChange={(e) => setChatSentimentFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      >
                        <option value="all">All Sentiments</option>
                        <option value="Positive">Positive</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Negative">Negative</option>
                      </select>

                      <select
                        value={chatResolutionFilter}
                        onChange={(e) => setChatResolutionFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      >
                        <option value="all">All Resolutions</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Pending Follow-up">Pending Follow-up</option>
                        <option value="Escalated">Escalated</option>
                      </select>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search summaries..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs w-48"
                      />
                    </div>
                  </div>

                  {chatReports.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No chat audit reports found matching filters.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                            <th className="py-2.5">Customer</th>
                            <th className="py-2.5">Agent</th>
                            <th className="py-2.5">Summary</th>
                            <th className="py-2.5">Sentiment</th>
                            <th className="py-2.5">Resolution</th>
                            <th className="py-2.5 text-right">Transcript</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {chatReports.map((r) => (
                            <tr key={r._id} className="hover:bg-slate-50 transition">
                              <td className="py-3 font-bold text-slate-900">{r.customerName}</td>
                              <td className="py-3 text-slate-600">{r.agentName}</td>
                              <td className="py-3 text-slate-700 max-w-xs truncate">{r.report?.summary}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  r.report?.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700' :
                                  r.report?.sentiment === 'Negative' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {r.report?.sentiment || 'Neutral'}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="font-semibold text-slate-600">{r.report?.resolutionStatus || 'Resolved'}</span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedTranscriptId(r._id)
                                    setIsTranscriptOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Transcript</span>
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

            {/* =================================================================
                SUB-VIEW: LEADS & ASSIGNMENT
                ================================================================= */}
            {activeNav === 'leads' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Unassigned Leads Queue</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Assign inbound Meta & organic leads to sales agents</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                  {unassignedLeads.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">All inbound leads are currently assigned to sales agents.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                            <th className="py-2.5">Lead Name</th>
                            <th className="py-2.5">Company</th>
                            <th className="py-2.5">Source</th>
                            <th className="py-2.5">Assign Agent</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {unassignedLeads.map((l) => (
                            <tr key={l._id} className="hover:bg-slate-50 transition">
                              <td className="py-3 font-bold text-slate-900">{l.name}</td>
                              <td className="py-3 text-slate-600">{l.company || 'Individual Client'}</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                  {l.source || 'Website'}
                                </span>
                              </td>
                              <td className="py-3">
                                <select
                                  value={selectedAgentForAssign[l._id] || ''}
                                  onChange={(e) => setSelectedAgentForAssign({ ...selectedAgentForAssign, [l._id]: e.target.value })}
                                  className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                                >
                                  <option value="">Select Sales Agent...</option>
                                  {agents.map((ag) => (
                                    <option key={ag._id} value={ag._id}>{ag.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleAssignLead(l._id)}
                                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                                >
                                  Assign
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

            {/* =================================================================
                SUB-VIEW: SETTINGS & MANAGER PROFILE
                ================================================================= */}
            {activeNav === 'settings' && (
              <div className="space-y-6 animate-fade-in max-w-xl">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Manager Profile Settings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Update profile avatar and personal credentials</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4 text-xs">
                  <div className="flex items-center gap-4">
                    <img
                      src={managerProfile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                      alt={managerProfile?.name || 'Manager'}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{managerProfile?.name}</h4>
                      <p className="text-slate-400">{managerProfile?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {managerProfile?.role}
                      </span>
                    </div>
                  </div>

                  <ProfileAvatarUploader
                    currentAvatar={managerProfile?.avatar}
                    userEmail={managerProfile?.email}
                    onAvatarUpdated={(newAvatar) => {
                      setManagerProfile((prev) => ({ ...prev, avatar: newAvatar }))
                      showToast('Profile image updated and saved!')
                    }}
                  />
                </div>
              </div>
            )}

            {/* =================================================================
                SUB-VIEW: DEALS PIPELINE & PORTFOLIO
                ================================================================= */}
            {activeNav === 'deals' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Deals Pipeline & Portfolio</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Track team active opportunities, probability forecasts, and closed deals</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Pipeline Total:</span>
                    <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-100">
                      $2,450,000
                    </span>
                  </div>
                </div>

                {/* Deals KPI Summary Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-slate-400 font-semibold">Active Opportunities</span>
                    <h4 className="text-2xl font-black text-slate-900 mt-1">{dealsList.length} Deals</h4>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-emerald-600 font-semibold">Avg. Deal Size</span>
                    <h4 className="text-2xl font-black text-emerald-700 mt-1">$98,160</h4>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-blue-600 font-semibold">Win Ratio</span>
                    <h4 className="text-2xl font-black text-blue-700 mt-1">68.4%</h4>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-purple-600 font-semibold">Weighted Forecast</span>
                    <h4 className="text-2xl font-black text-purple-700 mt-1">$1.82M</h4>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {['all', 'New Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'].map((stage) => (
                        <button
                          key={stage}
                          onClick={() => setDealStageFilter(stage)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            dealStageFilter === stage
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                          }`}
                        >
                          {stage === 'all' ? 'All Stages' : stage}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search deals, company, rep..."
                        value={dealSearchQuery}
                        onChange={(e) => setDealSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs w-60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredDeals.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No deals found matching criteria.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                            <th className="py-2.5">Deal Opportunity</th>
                            <th className="py-2.5">Company</th>
                            <th className="py-2.5">Value</th>
                            <th className="py-2.5">Sales Rep</th>
                            <th className="py-2.5">Stage</th>
                            <th className="py-2.5">Win Prob.</th>
                            <th className="py-2.5 text-right">Target Close</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDeals.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 font-bold text-slate-900">{d.title}</td>
                              <td className="py-3 text-slate-600 font-medium">{d.company}</td>
                              <td className="py-3 font-extrabold text-slate-900">${d.value.toLocaleString()}</td>
                              <td className="py-3 text-slate-600">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                                  {d.rep}
                                </span>
                              </td>
                              <td className="py-3">
                                <select
                                  value={d.stage}
                                  onChange={(e) => handleMoveDealStage(d.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                                    d.stage === 'Closed Won' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                    d.stage === 'Negotiation' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                                    d.stage === 'Proposal' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                    d.stage === 'Qualified' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                                    'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  <option value="New Lead">New Lead</option>
                                  <option value="Qualified">Qualified</option>
                                  <option value="Proposal">Proposal</option>
                                  <option value="Negotiation">Negotiation</option>
                                  <option value="Closed Won">Closed Won</option>
                                  <option value="Closed Lost">Closed Lost</option>
                                </select>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${d.probability}%` }} />
                                  </div>
                                  <span className="font-bold text-slate-700 text-[10px]">{d.probability}%</span>
                                </div>
                              </td>
                              <td className="py-3 text-right text-slate-500 font-medium">{d.closeDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================
                SUB-VIEW: CONTACTS DIRECTORY
                ================================================================= */}
            {activeNav === 'contacts' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Key Contacts & Client Directory</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Decision makers, enterprise leads, and client account managers</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Total Contacts:</span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-xs">
                      {contactsList.length}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {['all', 'Active Client', 'In Negotiation', 'Qualified Lead', 'New Lead'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setContactFilter(st)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            contactFilter === st
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                          }`}
                        >
                          {st === 'all' ? 'All Contacts' : st}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search contact, email, company..."
                        value={contactSearchQuery}
                        onChange={(e) => setContactSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs w-60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredContacts.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No contacts found matching search.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                            <th className="py-2.5">Contact Name</th>
                            <th className="py-2.5">Organization</th>
                            <th className="py-2.5">Email</th>
                            <th className="py-2.5">Direct Phone</th>
                            <th className="py-2.5">Assigned Rep</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredContacts.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50 transition">
                              <td className="py-3">
                                <div className="flex items-center gap-2.5">
                                  <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                  <div>
                                    <p className="font-bold text-slate-900 leading-tight">{c.name}</p>
                                    <p className="text-[10px] text-slate-400">{c.title}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 font-semibold text-slate-700">{c.company}</td>
                              <td className="py-3 text-slate-600">{c.email}</td>
                              <td className="py-3 text-slate-600 font-mono text-[11px]">{c.phone}</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px]">
                                  {c.rep}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  c.status === 'Active Client' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  c.status === 'In Negotiation' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={`mailto:${c.email}`}
                                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                                    title="Send Email"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`tel:${c.phone}`}
                                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                                    title="Call Contact"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </div>
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

            {/* =================================================================
                SUB-VIEW: COMPANIES & ACCOUNTS
                ================================================================= */}
            {activeNav === 'companies' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Enterprise Accounts & Companies</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Corporate accounts, managed client relationships, and company ARR</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Total Managed ARR:</span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-100">
                      $4,200,000
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <select
                        value={companyIndustryFilter}
                        onChange={(e) => setCompanyIndustryFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      >
                        <option value="all">All Industries</option>
                        <option value="Enterprise SaaS">Enterprise SaaS</option>
                        <option value="Cloud & AI Infrastructure">Cloud & AI Infrastructure</option>
                        <option value="FinTech & Payments">FinTech & Payments</option>
                        <option value="Digital Advertising">Digital Advertising</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Consulting & Analytics">Consulting & Analytics</option>
                      </select>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search company, industry, location..."
                        value={companySearchQuery}
                        onChange={(e) => setCompanySearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs w-60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredCompanies.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No company accounts found matching criteria.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                            <th className="py-2.5">Company Account</th>
                            <th className="py-2.5">Industry</th>
                            <th className="py-2.5">Organization Size</th>
                            <th className="py-2.5">Location</th>
                            <th className="py-2.5">Primary Contact</th>
                            <th className="py-2.5">Open Deals</th>
                            <th className="py-2.5 text-right">Status Tier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCompanies.map((cmp) => (
                            <tr key={cmp.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 font-extrabold text-slate-900 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                                  {cmp.name.charAt(0)}
                                </span>
                                <span>{cmp.name}</span>
                              </td>
                              <td className="py-3 text-slate-600 font-medium">{cmp.industry}</td>
                              <td className="py-3 text-slate-500">{cmp.size}</td>
                              <td className="py-3 text-slate-500">{cmp.location}</td>
                              <td className="py-3 font-semibold text-slate-800">{cmp.keyContact}</td>
                              <td className="py-3">
                                <span className="font-extrabold text-blue-700">${cmp.totalValue.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 block">({cmp.openDeals} deals)</span>
                              </td>
                              <td className="py-3 text-right">
                                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800">
                                  {cmp.status}
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

            {/* =================================================================
                SUB-VIEW: TASKS & TEAM FOLLOW-UPS
                ================================================================= */}
            {activeNav === 'tasks' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Manager & Team Action Tasks</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Keep sales follow-ups, client consultations, and proposals on schedule</p>
                  </div>
                  <button
                    onClick={() => setShowNewTaskModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Task</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {['all', 'pending', 'high', 'completed'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setTaskFilter(f)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                            taskFilter === f
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                          }`}
                        >
                          {f === 'all' ? 'All Tasks' : f === 'pending' ? 'Pending' : f === 'high' ? 'High Priority' : 'Completed'}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search tasks, company, rep..."
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs w-60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredTasks.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400">No scheduled tasks matching filters.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                            t.completed ? 'bg-slate-50/70 border-slate-100 opacity-70' : 'bg-white border-slate-200/70 hover:border-blue-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => handleToggleTask(t.id)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                                t.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 hover:border-blue-500'
                              }`}
                            >
                              {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <div className="min-w-0">
                              <p className={`font-bold text-xs truncate ${t.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {t.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                <span>{t.company}</span>
                                <span>•</span>
                                <span>Rep: <strong className="text-slate-600">{t.rep}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              t.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              t.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {t.priority}
                            </span>
                            <span className="text-slate-500 font-semibold text-[11px]">{t.dueDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================
                SUB-VIEW: ANALYTICS & PERFORMANCE
                ================================================================= */}
            {activeNav === 'analytics' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Manager Business Analytics</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Team quota velocity, lead acquisition performance, and conversion funnels</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    <span>Performance Cycle: Q4 2026</span>
                  </div>
                </div>

                {/* 4 Analytics Top KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-slate-400 font-semibold">Total Revenue Closed</span>
                    <h4 className="text-2xl font-black text-slate-900 mt-1">$1,840,000</h4>
                    <span className="text-[11px] font-bold text-emerald-600">↑ 24.5% vs Q3</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-blue-600 font-semibold">Quota Attainment</span>
                    <h4 className="text-2xl font-black text-blue-700 mt-1">92.4%</h4>
                    <span className="text-[11px] font-bold text-slate-400">Target: $2.0M</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-purple-600 font-semibold">Avg Sales Velocity</span>
                    <h4 className="text-2xl font-black text-purple-700 mt-1">18.2 Days</h4>
                    <span className="text-[11px] font-bold text-emerald-600">↓ 3.4 days faster</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs text-emerald-600 font-semibold">Lead Conversion</span>
                    <h4 className="text-2xl font-black text-emerald-700 mt-1">24.8%</h4>
                    <span className="text-[11px] font-bold text-emerald-600">↑ 4.2% lift</span>
                  </div>
                </div>

                {/* Agent Leaderboard & Lead Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Card 1: Agent Leaderboard */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">Sales Representative Leaderboard</h4>
                      <span className="text-xs text-slate-400 font-semibold">Monthly Quota</span>
                    </div>

                    <div className="space-y-4 text-xs">
                      {[
                        { name: 'Sarah Johnson', deals: 14, revenue: 580000, quota: 116, color: 'bg-emerald-500' },
                        { name: 'Michael Brown', deals: 11, revenue: 495000, quota: 99, color: 'bg-blue-500' },
                        { name: 'Emily Davis', deals: 8, revenue: 380000, quota: 85, color: 'bg-indigo-500' },
                        { name: 'John Smith', deals: 7, revenue: 310000, quota: 78, color: 'bg-violet-500' }
                      ].map((rep, idx) => (
                        <div key={rep.name} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                #{idx + 1}
                              </span>
                              {rep.name}
                            </span>
                            <span className="font-extrabold text-slate-800">
                              ${rep.revenue.toLocaleString()} ({rep.quota}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full ${rep.color} rounded-full`} style={{ width: `${Math.min(rep.quota, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 2: Inbound Lead Sources & Funnel */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">Lead Acquisition Channel ROI</h4>
                      <span className="text-xs text-slate-400 font-semibold">Conversion Rate</span>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {[
                        { channel: 'Organic Website & Search', volume: '840 Leads', rate: '32.4%', roi: '4.8x ROI', color: 'text-violet-700 bg-violet-50' },
                        { channel: 'Meta & Social Ads', volume: '620 Leads', rate: '26.8%', roi: '3.6x ROI', color: 'text-blue-700 bg-blue-50' },
                        { channel: 'Client Referrals & Word of Mouth', volume: '310 Leads', rate: '48.2%', roi: '8.2x ROI', color: 'text-emerald-700 bg-emerald-50' },
                        { channel: 'Cold Outreach & LinkedIn Email', volume: '240 Leads', rate: '14.5%', roi: '2.1x ROI', color: 'text-amber-700 bg-amber-50' }
                      ].map((src) => (
                        <div key={src.channel} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                          <div>
                            <p className="font-bold text-slate-900">{src.channel}</p>
                            <p className="text-[10px] text-slate-400">{src.volume}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${src.color}`}>
                              {src.rate} Conv.
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">{src.roi}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* Modal: Schedule Follow-up Task */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">+ Schedule Follow-up Task</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign customer consultation or proposal deadline</p>
              </div>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up demo call with VP of Technology"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Company</label>
                  <input
                    type="text"
                    value={newTaskCompany}
                    onChange={(e) => setNewTaskCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Rep</label>
                  <select
                    value={newTaskRep}
                    onChange={(e) => setNewTaskRep(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="Sarah Johnson">Sarah Johnson</option>
                    <option value="Michael Brown">Michael Brown</option>
                    <option value="Emily Davis">Emily Davis</option>
                    <option value="John Smith">John Smith</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="text"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD SALES AGENT
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">+ Add Sales Agent</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign sales representative under your management</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sufyan"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sufyan@gmail.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Quota ($)</label>
                  <input
                    type="number"
                    value={formData.monthlyQuota}
                    onChange={(e) => setFormData({ ...formData, monthlyQuota: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0322224242"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Direct Password Assignment *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Transcript Review Modal */}
      {isTranscriptOpen && selectedTranscriptId && (
        <ChatTranscriptModal
          isOpen={isTranscriptOpen}
          conversationId={selectedTranscriptId}
          onClose={() => {
            setIsTranscriptOpen(false)
            setSelectedTranscriptId(null)
          }}
        />
      )}

    </div>
  )
}

export default ManagerDashboard
