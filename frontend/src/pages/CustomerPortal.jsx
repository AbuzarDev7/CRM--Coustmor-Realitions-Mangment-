import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Calendar,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Building,
  LifeBuoy,
  Send,
  Paperclip,
  X,
  Check,
  Sparkles,
  Bell,
  ArrowRight,
  Layers,
  HelpCircle,
  CheckCircle,
  Receipt,
  Headphones,
  RefreshCw
} from 'lucide-react'
import CustomerChatWidget from '../components/CustomerChatWidget'
import { CUSTOMER_API_URL, API_BASE_URL } from '../config/api'
import ProfileAvatarUploader from '../components/ProfileAvatarUploader'


// ============================================================================
// INITIAL MOCK DATA (REALISTIC CLIENT DATA)
// ============================================================================

const initialClientUser = {
  name: 'Sarah Jenkins',
  company: 'Acme Enterprise Solutions Inc.',
  email: 's.jenkins@acmesolutions.io',
  phone: '+1 (415) 892-0199',
  clientId: 'CL-88421',
  plan: 'Enterprise Platinum SLA',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  address: '100 Montgomery St, Suite 2400, San Francisco, CA 94104'
}

const defaultAssignedAgent = {
  name: 'sufyan',
  displayName: 'Sufyan',
  role: 'Sales Agent',
  department: 'Sales & Solutions Delivery',
  email: 'sufyan@gmail.com',
  phone: '0322224242',
  whatsapp: '0322224242',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  hours: 'Mon - Sat, 9:00 AM - 6:00 PM PKT',
  availability: 'Online Now',
  status: 'Online',
  managerEmail: 'haider@gmail.com',
  dealsClosed: 3,
  totalValue: 57300,
  monthlyQuota: 35000,
  servicesOffered: [
    'Enterprise Cloud CRM Migration & Setup',
    'Meta Leadgen & Instant Forms Ingestion',
    'Custom Multi-Agent AI Workflow Engine',
    'Workflow Automation & WhatsApp VoIP Connect'
  ]
}

const initialServices = [
  {
    id: 'SRV-101',
    name: 'Enterprise Cloud CRM & Multi-Channel Pipeline Migration',
    category: 'Cloud Architecture & Pipeline Integration',
    status: 'In Progress',
    contractValue: '$14,800.00',
    startDate: 'Sep 15, 2026',
    targetDate: 'Nov 18, 2026',
    progress: 75,
    leadArchitect: 'Sufyan',
    agreementPdf: 'CRM_Enterprise_Migration_Agreement_Acme.pdf',
    currentStage: 2, // 0: Ordered, 1: Scope, 2: In Progress, 3: Review, 4: Delivered
    stages: [
      { label: 'Contract Signed', date: 'Sep 15, 2026', done: true },
      { label: 'Scope & Architecture', date: 'Sep 28, 2026', done: true },
      { label: 'In Progress (Dev & Data)', date: 'Oct 14, 2026', done: true, current: true },
      { label: 'Client UAT & Review', date: 'Nov 04, 2026', done: false },
      { label: 'Delivered & Handover', date: 'Nov 18, 2026', done: false }
    ],
    milestones: [
      { task: 'Database schema mapping & migration scripts', completed: true },
      { task: 'OAuth2 & SSO integration for 150 team seats', completed: true },
      { task: 'Real-time webhook synchronization engine', completed: true },
      { task: 'Staging environment UAT testing', completed: false },
      { task: 'Final cutover & staff onboarding workshop', completed: false }
    ]
  },
  {
    id: 'SRV-102',
    name: 'Meta Leadgen & Instant Forms Automated Ingestion',
    category: 'Marketing Automation & Ad Tech',
    status: 'In Progress',
    contractValue: '$8,200.00',
    startDate: 'Oct 01, 2026',
    targetDate: 'Nov 30, 2026',
    progress: 55,
    leadArchitect: 'Sufyan',
    agreementPdf: 'Meta_Leadgen_Statement_Acme.pdf',
    currentStage: 1,
    stages: [
      { label: 'Contract Signed', date: 'Oct 01, 2026', done: true },
      { label: 'Graph API Token Setup', date: 'Oct 12, 2026', done: true, current: true },
      { label: 'Instant Forms Mapping', date: 'Oct 25, 2026', done: false },
      { label: 'Real-time Webhook Testing', date: 'Nov 15, 2026', done: false },
      { label: 'Live Ingestion Launch', date: 'Nov 30, 2026', done: false }
    ],
    milestones: [
      { task: 'Meta Developer App & Webhook Verification', completed: true },
      { task: 'Hub challenge validation handler (/api/webhooks/meta)', completed: true },
      { task: 'Automatic lead capture & MongoDB persistence', completed: false },
      { task: 'Channel ROI analytics & conversion tracking', completed: false }
    ]
  },
  {
    id: 'SRV-103',
    name: 'Custom Multi-Agent AI Workflow Engine & Deal Pipeline',
    category: 'Enterprise AI & Workflow Engine',
    status: 'Proposal Sent',
    contractValue: '$18,000.00',
    startDate: 'Oct 10, 2026',
    targetDate: 'Dec 15, 2026',
    progress: 35,
    leadArchitect: 'Sufyan',
    agreementPdf: 'AI_Workflow_Engine_Proposal_Acme.pdf',
    currentStage: 1,
    stages: [
      { label: 'Discovery Workshop', date: 'Oct 10, 2026', done: true },
      { label: 'Architecture & Quota Approval', date: 'Oct 20, 2026', done: true, current: true },
      { label: 'Agent Pipeline Implementation', date: 'Nov 12, 2026', done: false },
      { label: 'Team Pilot Testing', date: 'Dec 01, 2026', done: false },
      { label: 'Full Production Deployment', date: 'Dec 15, 2026', done: false }
    ],
    milestones: [
      { task: 'Requirement discovery & workflow assessment', completed: true },
      { task: 'Sales rep Kanban pipeline configuration', completed: true },
      { task: 'Manager discount authorization & quota lock', completed: false },
      { task: 'Production deployment with 24/7 SLA monitoring', completed: false }
    ]
  }
]

const initialInvoices = [
  {
    id: 'INV-2026-004',
    serviceId: 'SRV-101',
    description: 'Enterprise CRM Migration - Milestone 2 (Data Sync & Integration)',
    date: 'Oct 10, 2026',
    dueDate: 'Oct 25, 2026',
    amount: 2450.00,
    status: 'Pending',
    method: 'ACH Transfer / Credit Card'
  },
  {
    id: 'INV-2026-003',
    serviceId: 'SRV-103',
    description: 'SOC-2 Compliance Security Audit - Interim Assessment',
    date: 'Sep 24, 2026',
    dueDate: 'Oct 08, 2026',
    amount: 4400.00,
    status: 'Paid',
    paidDate: 'Oct 02, 2026',
    method: 'Corporate Visa (ending in ••4912)'
  },
  {
    id: 'INV-2026-002',
    serviceId: 'SRV-102',
    description: 'Custom REST API Project - Phase 1 Kickoff & Architecture Retainer',
    date: 'Sep 01, 2026',
    dueDate: 'Sep 15, 2026',
    amount: 3100.00,
    status: 'Paid',
    paidDate: 'Sep 05, 2026',
    method: 'Wire Transfer'
  },
  {
    id: 'INV-2026-001',
    serviceId: 'SRV-101',
    description: 'Enterprise CRM Migration - Milestone 1 Initial Scope & Discovery',
    date: 'Aug 15, 2026',
    dueDate: 'Aug 30, 2026',
    amount: 4850.00,
    status: 'Paid',
    paidDate: 'Aug 22, 2026',
    method: 'Corporate Visa (ending in ••4912)'
  }
]

const initialTickets = [
  {
    id: 'TCK-2026-892',
    subject: 'Request for custom IP allowlisting on Staging Webhooks',
    category: 'Technical Support',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: 'Yesterday at 3:15 PM',
    lastReply: 'Marcus Vance replied 3 hours ago: "Added IP range 198.51.100.0/24 to the firewall rules."',
    messagesCount: 3
  },
  {
    id: 'TCK-2026-871',
    subject: 'Question on Invoice #INV-2026-004 Payment Terms & Wire Instructions',
    category: 'Billing & Invoices',
    priority: 'Low',
    status: 'Resolved',
    createdAt: 'Oct 08, 2026',
    lastReply: 'Billing Team replied: "Sent PDF with bank routing and international IBAN."',
    messagesCount: 2
  },
  {
    id: 'TCK-2026-840',
    subject: 'Request copy of interim SOC-2 Penetration Testing Executive Summary',
    category: 'Project Scope & Deliverables',
    priority: 'High',
    status: 'Resolved',
    createdAt: 'Sep 29, 2026',
    lastReply: 'Marcus Vance replied: "Document uploaded to your portal under Agreements."',
    messagesCount: 4
  }
]

// ============================================================================
// MAIN CUSTOMER PORTAL COMPONENT
// ============================================================================

const CustomerPortal = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout: authLogout, updateUser } = useAuth()

  // Navigation Tabs: 'overview' | 'services' | 'billing' | 'support' | 'profile'
  const [activeTab, setActiveTab] = useState('overview')

  // Dynamic logged-in customer data with graceful fallbacks
  const customerName = isAuthenticated && user?.name
    ? user.name
    : isAuthenticated && user?.email
    ? user.email.split('@')[0]
    : 'Guest'

  const customerCompany = isAuthenticated && user?.company
    ? user.company
    : 'Acme Enterprise Solutions Inc.'

  const customerRole = isAuthenticated && user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Customer'

  const customerEmail = isAuthenticated && user?.email
    ? user.email
    : 'guest@onesoftcrm.com'

  // Editable customer profile state & avatar management
  const [customerAvatar, setCustomerAvatar] = useState(user?.avatar || initialClientUser.avatar || '')
  const [customerProfileData, setCustomerProfileData] = useState({
    name: customerName,
    company: customerCompany,
    email: customerEmail,
    phone: user?.phone || initialClientUser.phone,
    address: user?.address || initialClientUser.address
  })
  const [isSavingCustomerProfile, setIsSavingCustomerProfile] = useState(false)

  // Sync state whenever authenticated user object changes
  useEffect(() => {
    if (user) {
      if (user.avatar) setCustomerAvatar(user.avatar)
      setCustomerProfileData({
        name: user.name || customerName,
        company: user.company || customerCompany,
        email: user.email || customerEmail,
        phone: user.phone || initialClientUser.phone,
        address: user.address || initialClientUser.address
      })
    }
  }, [user])

  const handleCustomerAvatarChange = async (newAvatar) => {
    setCustomerAvatar(newAvatar)
    if (updateUser) {
      updateUser({ avatar: newAvatar })
    }
    const stored = localStorage.getItem('crm_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        u.avatar = newAvatar
        localStorage.setItem('crm_user', JSON.stringify(u))
      } catch (e) {
        console.warn(e)
      }
    }

    // Auto-persist immediately to MongoDB database
    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          email: customerProfileData.email,
          name: customerProfileData.name,
          avatar: newAvatar,
          phone: customerProfileData.phone
        })
      })
      triggerToast('Customer avatar updated and saved to database!', 'success')
    } catch (err) {
      console.warn('Customer avatar auto-persist error:', err)
    }
  }

  const handleSaveCustomerProfile = async (e) => {
    if (e) e.preventDefault()
    setIsSavingCustomerProfile(true)
    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          email: customerProfileData.email,
          name: customerProfileData.name,
          avatar: customerAvatar,
          phone: customerProfileData.phone
        })
      })

      if (updateUser) {
        updateUser({
          avatar: customerAvatar,
          name: customerProfileData.name,
          phone: customerProfileData.phone
        })
      }

      const stored = localStorage.getItem('crm_user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          u.avatar = customerAvatar
          u.name = customerProfileData.name
          u.phone = customerProfileData.phone
          localStorage.setItem('crm_user', JSON.stringify(u))
        } catch (e) {
          console.warn(e)
        }
      }

      triggerToast('Customer profile and avatar updated successfully!', 'success')
    } catch (err) {
      triggerToast('Profile updated locally: ' + err.message, 'success')
    } finally {
      setIsSavingCustomerProfile(false)
    }
  }

  const clientUser = {
    ...initialClientUser,
    ...(user || {}),
    name: customerProfileData.name || customerName,
    company: customerProfileData.company || customerCompany,
    email: customerProfileData.email || customerEmail,
    role: customerRole,
    plan: user?.plan || initialClientUser.plan,
    clientId: user?.clientId || (user?._id ? `CL-${user._id.slice(-5).toUpperCase()}` : initialClientUser.clientId),
    avatar: customerAvatar || user?.avatar || initialClientUser.avatar,
    phone: customerProfileData.phone || user?.phone || initialClientUser.phone,
    address: customerProfileData.address || user?.address || initialClientUser.address
  }

  // Assigned Sales Representative from Database (sufyan@gmail.com)
  const [assignedAgent, setAssignedAgent] = useState(defaultAssignedAgent)
  const [loadingAgent, setLoadingAgent] = useState(false)

  // Fetch real agent and solutions/deals from database
  useEffect(() => {
    let isMounted = true
    const fetchAgentData = async () => {
      try {
        setLoadingAgent(true)
        const res = await fetch(`${CUSTOMER_API_URL}/agent`, { credentials: 'include' })
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.agent) {
            setAssignedAgent((prev) => ({
              ...prev,
              ...data.agent,
              displayName: data.agent.name
                ? data.agent.name.charAt(0).toUpperCase() + data.agent.name.slice(1)
                : 'Sufyan'
            }))
          }
          if (data.services && data.services.length > 0) {
            const formatted = data.services.map((srv, idx) => ({
              ...srv,
              stages: Array.isArray(srv.stages) && srv.stages.length > 0
                ? srv.stages
                : (initialServices[idx]?.stages || initialServices[0].stages),
              milestones: Array.isArray(srv.milestones) && srv.milestones.length > 0
                ? srv.milestones
                : (initialServices[idx]?.milestones || initialServices[0].milestones)
            }))
            setServices(formatted)
            setSelectedServiceId(formatted[0].id)
          }
        }
      } catch (err) {
        console.warn('Customer agent API fetch fallback to database defaults:', err)
      } finally {
        if (isMounted) setLoadingAgent(false)
      }
    }

    fetchAgentData()
    return () => {
      isMounted = false
    }
  }, [])

  // State Collections
  const [services, setServices] = useState(initialServices)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [tickets, setTickets] = useState(initialTickets)
  const [selectedServiceId, setSelectedServiceId] = useState(initialServices[0].id)

  // Filters
  const [invoiceFilter, setInvoiceFilter] = useState('all') // all | pending | paid
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [ticketSearch, setTicketSearch] = useState('')

  // Modals & Drawers
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [toastNotification, setToastNotification] = useState(null)

  // Ticket Form State
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Technical Support',
    priority: 'Medium',
    message: '',
    attachmentName: ''
  })

  // Simulated Payment Form State
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '•••• •••• •••• 4912',
    expDate: '08/28',
    cvv: '•••',
    zip: '94104'
  })

  // Show Toast Utility
  const triggerToast = (message, type = 'success') => {
    setToastNotification({ message, type })
    setTimeout(() => {
      setToastNotification(null)
    }, 4000)
  }

  // Logout Handler
  const handleLogout = () => {
    authLogout()
    navigate('/login')
  }

  // Computed KPIs
  const activeServicesCount = useMemo(() => {
    return services.filter((s) => s.status === 'In Progress' || s.status === 'Review').length
  }, [services])

  const pendingInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'Pending' || inv.status === 'Overdue')
  }, [invoices])

  const outstandingBalance = useMemo(() => {
    return pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  }, [pendingInvoices])

  const openTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length
  }, [tickets])

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.description.toLowerCase().includes(invoiceSearch.toLowerCase())
      if (!matchesSearch) return false

      if (invoiceFilter === 'pending') return inv.status === 'Pending' || inv.status === 'Overdue'
      if (invoiceFilter === 'paid') return inv.status === 'Paid'
      return true
    })
  }, [invoices, invoiceFilter, invoiceSearch])

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(ticketSearch.toLowerCase())
    )
  }, [tickets, ticketSearch])

  // Currently Selected Service
  const selectedService = useMemo(() => {
    const srv = (services || []).find((s) => s.id === selectedServiceId) || services[0] || initialServices[0]
    return {
      ...srv,
      stages: Array.isArray(srv?.stages) && srv.stages.length > 0
        ? srv.stages
        : (initialServices[0]?.stages || []),
      milestones: Array.isArray(srv?.milestones) && srv.milestones.length > 0
        ? srv.milestones
        : (initialServices[0]?.milestones || [])
    }
  }, [services, selectedServiceId])

  // Action: Open Ticket Submit
  const handleCreateTicket = (e) => {
    e.preventDefault()
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      triggerToast('Please provide both a subject and message for your ticket.', 'error')
      return
    }

    const ticketItem = {
      id: `TCK-2026-${Math.floor(100 + Math.random() * 900)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'Open',
      createdAt: 'Just now',
      lastReply: `You submitted: "${newTicket.message.slice(0, 50)}..."`,
      messagesCount: 1,
      attachment: newTicket.attachmentName || null
    }

    setTickets([ticketItem, ...tickets])
    setNewTicket({
      subject: '',
      category: 'Technical Support',
      priority: 'Medium',
      message: '',
      attachmentName: ''
    })
    setIsTicketModalOpen(false)
    triggerToast(`Ticket ${ticketItem.id} created successfully! Our team has been notified.`, 'success')
  }

  // Action: Download Agreement Simulation
  const handleDownloadAgreement = (service) => {
    triggerToast(`Downloading official signed agreement for "${service.name}" (${service.agreementPdf})...`, 'info')
  }

  // Action: Download Invoice PDF Simulation
  const handleDownloadInvoicePdf = (invoice) => {
    triggerToast(`Downloading PDF receipt for invoice ${invoice.id} ($${invoice.amount.toFixed(2)})...`, 'info')
  }

  // Action: Open Payment Modal
  const openPaymentForInvoice = (invoice) => {
    setSelectedInvoiceToPay(invoice)
    setIsPayModalOpen(true)
  }

  // Action: Process Instant Payment
  const handleProcessPayment = (e) => {
    e.preventDefault()
    setPaymentProcessing(true)

    setTimeout(() => {
      if (selectedInvoiceToPay) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === selectedInvoiceToPay.id
              ? {
                  ...inv,
                  status: 'Paid',
                  paidDate: 'Just now',
                  method: 'Corporate Visa (ending in ••4912)'
                }
              : inv
          )
        )
      }
      setPaymentProcessing(false)
      setIsPayModalOpen(false)
      triggerToast(
        `Payment of $${selectedInvoiceToPay?.amount.toFixed(2)} for ${selectedInvoiceToPay?.id} succeeded! Receipt generated.`,
        'success'
      )
      setSelectedInvoiceToPay(null)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-violet-200 selection:text-violet-900 flex flex-col">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 animate-slide-up ${
            toastNotification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toastNotification.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastNotification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : toastNotification.type === 'info' ? (
            <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toastNotification.message}</span>
          <button
            onClick={() => setToastNotification(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          TOP HEADER & NAVIGATION
          ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Client Portal Tag */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M12 7a5 5 0 015 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                    Onesoft
                  </span>
                  <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider mt-0.5">
                    {isAuthenticated && user?.role ? `${user.role.toUpperCase()} WORKSPACE` : 'CLIENT WORKSPACE'}
                  </span>
                </div>
              </Link>

              {/* Security Pill */}
              <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit Encrypted Client Area</span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Portal Navigation">
              {[
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'services', label: 'My Services & Orders', icon: Briefcase },
                { id: 'billing', label: 'Invoices & Billing', icon: Receipt },
                { id: 'support', label: 'Support Desk', icon: Headphones },
                { id: 'profile', label: 'Company Profile', icon: Building }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-violet-50 text-violet-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              {/* Quick Contact Agent Button */}
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Call</span>
              </button>

              {/* Dynamic User Profile Display */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="flex items-center gap-2.5 hover:opacity-90 transition text-left cursor-pointer group"
                    title="Click to view & edit Profile Photo"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-violet-500/20 group-hover:ring-violet-500/60 transition">
                      {clientUser.avatar ? (
                        <img
                          src={clientUser.avatar}
                          alt={clientUser.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')
                      )}
                    </div>
                    <div className="hidden xl:block text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-violet-600 transition">
                          {clientUser.name || user.name || user.email?.split('@')[0]}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-700">
                          {user.role || 'Customer'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                        {clientUser.company || user.company || user.email}
                      </div>
                    </div>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    aria-label="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-semibold text-slate-700 block">Guest</span>
                    <span className="text-[10px] text-slate-400 block">Not Signed In</span>
                  </div>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors ml-1 cursor-pointer"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden border-t border-slate-100 bg-white px-2 py-1.5 flex items-center justify-between overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'services', label: 'Services' },
            { id: 'billing', label: 'Billing' },
            { id: 'support', label: 'Support' },
            { id: 'profile', label: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'bg-violet-600 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* =====================================================================
          MAIN DASHBOARD CONTAINER
          ===================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ===================================================================
            SECTION 1: GREETING BANNER & DEDICATED AGENT WIDGET
            =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Welcome Greeting Banner (Col 8) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-md shadow-violet-900/10 flex flex-col justify-between relative overflow-hidden">
            {/* Background Aesthetic Circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide text-violet-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{clientUser.plan}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome back, {customerName}
              </h1>
              <p className="text-violet-100 text-sm max-w-xl leading-relaxed">
                Here is your live transparent self-service dashboard for{' '}
                <strong className="text-white">{customerCompany}</strong>. Track your active deliverables,
                review billing invoices, and collaborate directly with your assigned account team.
              </p>
            </div>

            <div className="relative z-10 pt-6 mt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-violet-200">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-violet-300 block text-[11px]">Client Account No.</span>
                  <span className="font-mono font-semibold text-white text-xs">{clientUser.clientId}</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-violet-300 block text-[11px]">SLA Response Window</span>
                  <span className="font-semibold text-white text-xs">&lt; 1 Hour Guaranteed</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTicketModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-violet-800 font-semibold hover:bg-violet-50 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Open Ticket</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Account Manager Widget (Col 5) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-600" />
                  Your Account Manager
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {assignedAgent.availability || 'Online Now'}
                </span>
              </div>

              <div className="flex items-start gap-4 mt-4">
                <div className="relative">
                  <img
                    src={assignedAgent.avatar}
                    alt={assignedAgent.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-violet-600/20 shadow-xs"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {assignedAgent.displayName || assignedAgent.name}
                  </h3>
                  <p className="text-xs font-medium text-violet-700 truncate">
                    {assignedAgent.role}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {assignedAgent.department}
                  </p>
                </div>
              </div>

              {/* Direct Details */}
              <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                  </span>
                  <a
                    href={`mailto:${assignedAgent.email}`}
                    className="font-medium text-slate-800 hover:text-violet-600 truncate max-w-[200px]"
                  >
                    {assignedAgent.email}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Direct Line:
                  </span>
                  <a
                    href={`tel:${assignedAgent.phone}`}
                    className="font-medium text-slate-800 hover:text-violet-600"
                  >
                    {assignedAgent.phone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Working Hours:
                  </span>
                  <span className="text-slate-600 font-medium">{assignedAgent.hours}</span>
                </div>
              </div>

              {/* Solutions & Services Sold by this Agent */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Solutions Sold by {assignedAgent.displayName || assignedAgent.name}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(assignedAgent.servicesOffered || [
                    'Enterprise Cloud CRM Migration',
                    'Meta Leadgen Instant Forms',
                    'Custom AI Workflow Engine'
                  ]).map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Contact CTAs */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-100">
              <a
                href={`mailto:${assignedAgent.email}?subject=Customer%20Portal%20Inquiry%20-%20${clientUser.company}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200/50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Agent</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open_customer_chat'))
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/50 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Chat</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Dedicated Profile & Avatar Uploader Widget */}
            <ProfileAvatarUploader
              avatar={clientUser.avatar}
              name={clientUser.name}
              role={clientUser.role || 'Customer'}
              email={clientUser.email}
              onAvatarChange={handleCustomerAvatarChange}
              showToast={(msg) => triggerToast(msg, 'success')}
            />

            {/* Client Organization & Authorized Contacts Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Client Organization & Authorized Contacts
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage your organization details, billing address, and authorized customer representatives.
                  </p>
                </div>
                <button
                  onClick={handleSaveCustomerProfile}
                  disabled={isSavingCustomerProfile}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingCustomerProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company Registered Name</label>
                    <input
                      type="text"
                      value={customerProfileData.company}
                      onChange={(e) => setCustomerProfileData({ ...customerProfileData, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Authorized Contact</label>
                    <input
                      type="text"
                      value={customerProfileData.name}
                      onChange={(e) => setCustomerProfileData({ ...customerProfileData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Billing Email Address</label>
                    <input
                      type="email"
                      value={customerProfileData.email}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Office / Billing Address</label>
                    <input
                      type="text"
                      value={customerProfileData.address}
                      onChange={(e) => setCustomerProfileData({ ...customerProfileData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      value={customerProfileData.phone}
                      onChange={(e) => setCustomerProfileData({ ...customerProfileData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Current Service Level Tier</label>
                    <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 font-semibold text-slate-700">
                      {clientUser.plan} (24/7 SLA Active)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ===================================================================
                SECTION 2: TOP KPI CARDS
                =================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* KPI 1: Active Services */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative overflow-hidden group hover:border-violet-300 transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Services & Deals
              </span>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeServicesCount}
              </div>
              <p className="text-xs text-slate-500 pt-1">
                2 in execution phase, 1 in final client review
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Target Deliverables On Track</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 2: Outstanding Balance & Pay Now */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative overflow-hidden group hover:border-violet-300 transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Invoices Balance
              </span>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                ${outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 pt-1">
                {pendingInvoices.length > 0
                  ? `${pendingInvoices.length} invoice pending due soon`
                  : 'All invoices are up-to-date and paid'}
              </p>
              <div className="pt-2">
                {pendingInvoices.length > 0 ? (
                  <button
                    onClick={() => openPaymentForInvoice(pendingInvoices[0])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Now (${pendingInvoices[0].amount.toFixed(2)})</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Zero Outstanding Balance
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 3: Open Support Requests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-start justify-between relative overflow-hidden group hover:border-violet-300 transition-all sm:col-span-2 lg:col-span-1">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Open Support Requests
              </span>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {openTicketsCount}{' '}
                <span className="text-base font-medium text-slate-400">/ {tickets.length} total</span>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                Average reply time across portal: <strong className="text-slate-700">42 minutes</strong>
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsTicketModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit New Assistance Ticket &rarr;</span>
                </button>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECTION 3: ACTIVE DEALS / SERVICE TRACKER WITH PROGRESS STEPPER
            =================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                  <Briefcase className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Solutions & Services Sold by {assignedAgent.displayName || assignedAgent.name}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live transparency on deliverables, contracts, and project milestones sold and managed by your assigned agent ({assignedAgent.email}).
              </p>
            </div>

            {/* Service Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {services.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedService.id === srv.id
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {srv.name.split(' ')[0]} ({srv.progress}%)
                </button>
              ))}
            </div>
          </div>

          {/* Selected Service Card Header */}
          <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                  {selectedService.id}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedService.category}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {selectedService.name}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span>Contract Value: <strong className="text-slate-800">{selectedService.contractValue}</strong></span>
                <span>•</span>
                <span>Target Delivery: <strong className="text-slate-800">{selectedService.targetDate}</strong></span>
                <span>•</span>
                <span>Lead: <strong className="text-slate-800">{selectedService.leadArchitect || assignedAgent.displayName || 'Sufyan'}</strong></span>
              </div>
            </div>

            {/* Agreement Download Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDownloadAgreement(selectedService)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-violet-400 text-slate-700 hover:text-violet-700 font-semibold text-xs shadow-xs hover:shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5 text-violet-600" />
                <span>Download Signed Agreement (PDF)</span>
              </button>
            </div>
          </div>

          {/* Visual Progress Stepper */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Project Stepper
              </span>
              <span className="text-xs font-bold text-violet-700">
                {selectedService.progress}% Complete
              </span>
            </div>

            {/* Stepper Track */}
            <div className="relative">
              {/* Stepper background connector line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
              <div
                className="hidden md:block absolute top-1/2 left-0 h-1 bg-violet-600 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${selectedService.progress}%` }}
              />

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {(selectedService?.stages || []).map((stage, idx) => {
                  const isDone = stage.done && !stage.current
                  const isCurrent = stage.current
                  const isPending = !stage.done

                  return (
                    <div
                      key={idx}
                      className={`flex md:flex-col items-center gap-3 md:gap-2 p-3 md:p-2 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-violet-50/80 md:bg-transparent border border-violet-200 md:border-none'
                          : ''
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isCurrent
                            ? 'bg-violet-600 text-white ring-4 ring-violet-200 shadow-md animate-pulse'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div className="md:text-center">
                        <div
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-violet-900'
                              : isDone
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </div>
                        <div className="text-[11px] text-slate-500">{stage.date}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Key Deliverables Checkpoints */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Milestone Deliverables Checklist
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(selectedService?.milestones || []).map((m, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                    m.completed
                      ? 'bg-emerald-50/40 border-emerald-100 text-slate-700'
                      : 'bg-slate-50/60 border-slate-200/60 text-slate-500'
                  }`}
                >
                  {m.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className={m.completed ? 'font-medium' : ''}>{m.task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECTION 4: INVOICES & BILLING TABLE
            =================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Receipt className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Invoices & Statements History
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Review verified billing statements, tax receipts, and execute instant secure payments.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice #..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 w-36 sm:w-44"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setInvoiceFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    invoiceFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : ''
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setInvoiceFilter('pending')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    invoiceFilter === 'pending' ? 'bg-white shadow-xs text-amber-700 font-bold' : ''
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setInvoiceFilter('paid')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    invoiceFilter === 'paid' ? 'bg-white shadow-xs text-emerald-700 font-bold' : ''
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Billing Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{inv.date}</div>
                        <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                        <div className="font-medium text-slate-800">{inv.description}</div>
                        <div className="text-[10px] text-slate-400">{inv.method}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {inv.status === 'Paid' ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status !== 'Paid' && (
                            <button
                              onClick={() => openPaymentForInvoice(inv)}
                              className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors"
                            >
                              Pay Now
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadInvoicePdf(inv)}
                            title="Download PDF Invoice"
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-slate-600 hover:text-violet-700 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No invoices found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================================================================
            SECTION 5: SUPPORT HELP DESK
            =================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700">
                  <Headphones className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Customer Support Help Desk
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Submit technical questions, scope modifications, or billing requests directly to our support desk.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 w-36 sm:w-44"
                />
              </div>

              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs hover:shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Open New Ticket</span>
              </button>
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-3">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-violet-300 bg-white hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                        {ticket.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {ticket.category}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400">Created {ticket.createdAt}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{ticket.subject}</h4>
                    <p className="text-xs text-slate-600 line-clamp-1">{ticket.lastReply}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Priority Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ticket.priority === 'High'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : ticket.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ticket.priority}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ticket.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {ticket.status}
                    </span>

                    <button
                      onClick={() =>
                        triggerToast(`Viewing full discussion thread for ticket ${ticket.id}`, 'info')
                      }
                      className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
                      title="View Ticket Discussion"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No tickets matching your search query.
              </div>
            )}
          </div>
        </div>

          </>
        )}
      </main>

      {/* =====================================================================
          MODAL: OPEN NEW SUPPORT TICKET
          ===================================================================== */}
      {isTicketModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsTicketModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                  <Headphones className="w-4 h-4" />
                </span>
                <h3 id="ticket-modal-title" className="text-base font-bold text-slate-900">
                  Submit New Support Request
                </h3>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Briefly describe what you need assistance with..."
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing & Invoices">Billing & Invoices</option>
                    <option value="Project Scope & Deliverables">Project Scope & Deliverables</option>
                    <option value="General Account Inquiry">General Account Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
                  >
                    <option value="Low">Low - Informational</option>
                    <option value="Medium">Medium - Normal Attention</option>
                    <option value="High">High - Urgent Assistance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Detailed Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide any relevant details, error logs, or links..."
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attachment (Optional)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach Screenshot / PDF</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewTicket({ ...newTicket, attachmentName: file.name })
                        }
                      }}
                    />
                  </label>
                  {newTicket.attachmentName && (
                    <span className="text-violet-700 font-mono text-[11px] truncate max-w-[180px]">
                      {newTicket.attachmentName}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-xs transition-colors"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: INSTANT INVOICE PAYMENT
          ===================================================================== */}
      {isPayModalOpen && selectedInvoiceToPay && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={() => !paymentProcessing && setIsPayModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                  <CreditCard className="w-4 h-4" />
                </span>
                <h3 id="pay-modal-title" className="text-base font-bold text-slate-900">
                  Secure Invoice Payment
                </h3>
              </div>
              {!paymentProcessing && (
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleProcessPayment} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-100 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedInvoiceToPay.id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Description:</span>
                  <span className="truncate max-w-[200px] font-medium text-slate-800">
                    {selectedInvoiceToPay.description}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 pt-1 border-t border-violet-200/50 text-sm font-extrabold">
                  <span>Total Amount Due:</span>
                  <span className="text-violet-700">
                    ${selectedInvoiceToPay.amount.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Card Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    required
                    value={cardDetails.expDate}
                    onChange={(e) => setCardDetails({ ...cardDetails, expDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CVC / CVV</label>
                  <input
                    type="text"
                    required
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={cardDetails.zip}
                    onChange={(e) => setCardDetails({ ...cardDetails, zip: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>PCI-DSS Level 1 Encrypted Transaction</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-xs transition-colors flex items-center gap-2"
                >
                  {paymentProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <span>Pay ${selectedInvoiceToPay.amount.toFixed(2)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: BOOK 1-ON-1 CALL WITH AGENT
          ===================================================================== */}
      {isScheduleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 id="schedule-modal-title" className="text-base font-bold text-slate-900">
                  Schedule Call with {dedicatedAgent.name}
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600">
                Choose a priority slot for a 30-minute sync on project milestones or deliverables:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {['Today, 3:30 PM EST', 'Tomorrow, 10:00 AM EST', 'Tomorrow, 2:00 PM EST', 'Thursday, 11:30 AM EST'].map(
                  (slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setIsScheduleModalOpen(false)
                        triggerToast(`Confirmed call with ${dedicatedAgent.name} for ${slot}! Google Meet link sent to your email.`, 'success')
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-violet-500 hover:bg-violet-50/70 text-slate-800 font-medium text-left transition-all"
                    >
                      <div className="text-[10px] text-violet-600 font-bold uppercase">Available Slot</div>
                      <div className="font-semibold">{slot}</div>
                    </button>
                  )
                )}
              </div>

              <div className="pt-2 text-center text-slate-400 text-[11px]">
                Or email Marcus directly at{' '}
                <a href={`mailto:${dedicatedAgent.email}`} className="text-violet-600 font-semibold underline">
                  {dedicatedAgent.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FOOTER
          ===================================================================== */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Onesoft Customer Workspace</span>
            <span>•</span>
            <span>Version 2.4 Enterprise SLA</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Confidential & Secure</span>
            <span>•</span>
            <a href="mailto:support@onesoftcrm.com" className="hover:text-violet-600 transition-colors">
              support@onesoftcrm.com
            </a>
          </div>
        </div>
      </footer>

      {/* Real-Time WhatsApp-Style Customer-to-Agent Live Chat Widget */}
      <CustomerChatWidget
        customer={clientUser}
        assignedAgent={assignedAgent}
      />
    </div>
  )
}

export default CustomerPortal
