import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
  FileCheck,
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
  Target,
  ExternalLink,
  X,
  RefreshCw,
  Plus,
  ShieldAlert,
  Lock,
  ShieldCheck,
  Settings
} from 'lucide-react'
import { API_BASE_URL, AGENT_API_URL, CHAT_API_URL, SOCKET_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import ChatReportModal from '../components/ChatReportModal'
import ProfileAvatarUploader from '../components/ProfileAvatarUploader'

// Empty initial state - dynamically populated strictly from the database
const initialTodayTasks = []
const initialAssignedLeads = []
const initialPipelineDeals = []

const KANBAN_STAGES = ['Contacted', 'Proposal Sent', 'In Negotiation', 'Deal Won']

const AgentDashboard = () => {
  const navigate = useNavigate()
  const { user: authUser, logout: authLogout, updateUser } = useAuth()
  const [currentUser, setCurrentUser] = useState(null)
  const [currentSection, setCurrentSection] = useState('tasks') // 'tasks', 'leads', 'pipeline', 'logs', 'chats'
  const [toastMessage, setToastMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Synchronized Agent Profile Details (strictly dynamic from auth and database)
  const activeUser = currentUser || authUser
  const agentDisplayName = activeUser?.name || (activeUser?.email ? activeUser.email.split('@')[0] : 'Sales Agent')
  const agentDisplayEmail = activeUser?.email || 'agent@onesoft.com'
  const agentInitial = agentDisplayName.charAt(0).toUpperCase()
  const agentFirstName = agentDisplayName.split(' ')[0]
  const agentRole = activeUser?.role || 'Sales Agent'
  const [agentAvatar, setAgentAvatar] = useState(activeUser?.avatar || '')

  useEffect(() => {
    if (activeUser?.avatar) {
      setAgentAvatar(activeUser.avatar)
    }
  }, [activeUser?.avatar])

  const handleAgentAvatarChange = async (newAvatar) => {
    setAgentAvatar(newAvatar)
    if (currentUser) {
      setCurrentUser((prev) => ({ ...prev, avatar: newAvatar }))
    }
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
          email: agentDisplayEmail,
          name: agentDisplayName,
          avatar: newAvatar
        })
      })
      showToast('Sales Agent profile photo saved to database successfully!')
    } catch (err) {
      console.warn('Agent avatar auto-persist error:', err)
    }
  }

  const handleSaveAgentProfile = async (e) => {
    if (e) e.preventDefault()
    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const finalAv = agentAvatar || activeUser?.avatar || ''

      await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          email: agentDisplayEmail,
          name: agentDisplayName,
          avatar: finalAv
        })
      })

      if (updateUser) {
        updateUser({ avatar: finalAv })
      }

      const stored = localStorage.getItem('crm_user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          u.avatar = finalAv
          localStorage.setItem('crm_user', JSON.stringify(u))
        } catch (e) {
          console.warn(e)
        }
      }

      showToast('Sales Agent profile and photo saved successfully!')
    } catch (err) {
      showToast('Profile updated: ' + err.message)
    }
  }

  // Real-Time Customer Chat System State
  const [activeChats, setActiveChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [agentInputText, setAgentInputText] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [socket, setSocket] = useState(null)
  const [chatSearch, setChatSearch] = useState('')
  const [chatFilter, setChatFilter] = useState('all') // 'all' | 'active' | 'reported'
  const [customerIsTyping, setCustomerIsTyping] = useState(false)
  const chatMessagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const selectedChatRef = useRef(null)
  selectedChatRef.current = selectedChat
  const agentTypingTimeoutRef = useRef(null)


  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Daily Tasks State strictly from database
  const [tasks, setTasks] = useState([])

  // Assigned Leads State strictly from database
  const [leads, setLeads] = useState([])

  // Personal Kanban State strictly from database
  const [deals, setDeals] = useState([])

  // Activity Logs Stream strictly from database
  const [activityLogs, setActivityLogs] = useState([])

  // Modals State
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedLeadForNote, setSelectedLeadForNote] = useState(null)

  // Request Approval Form
  const [approvalForm, setApprovalForm] = useState({
    clientName: '',
    dealTitle: '',
    currentAmount: 0,
    discountPercent: 10,
    justification: ''
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
    fetchAgentChats()
  }, [navigate])

  // Fetch Agent Chat Queue
  const fetchAgentChats = useCallback(async () => {
    try {
      const email = currentUser?.email || authUser?.email || ''
      const res = await fetch(`${CHAT_API_URL}/agent/queue?agentEmail=${encodeURIComponent(email)}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        const chats = data.conversations || []
        setActiveChats(chats)
        // Automatically select first chat if none is currently selected
        if (!selectedChatRef.current && chats.length > 0) {
          setSelectedChat(chats[0])
        }
      }
    } catch (err) {
      console.warn('Fetch agent queue error:', err.message)
    }
  }, [currentUser?.email, authUser?.email])

  // Fetch agent chats whenever user session becomes available
  useEffect(() => {
    if (currentUser?.email || authUser?.email) {
      fetchAgentChats()
    }
  }, [currentUser?.email, authUser?.email, fetchAgentChats])

  // Real-Time Socket Connection for Agent (persisted across conversation selections)
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    const registerAgentRooms = () => {
      // 1. Explicitly join agents room & staff room so agent receives all incoming customer chats
      newSocket.emit('join_agents_room', {
        userEmail: agentDisplayEmail
      })

      // 2. Identify user personal room
      newSocket.emit('identify', {
        userEmail: agentDisplayEmail,
        role: 'agent'
      })

      // 3. Join active conversation room if selected
      if (selectedChatRef.current?._id) {
        newSocket.emit('join_conversation', {
          conversationId: String(selectedChatRef.current._id),
          role: 'agent',
          userName: agentDisplayName,
          userEmail: agentDisplayEmail
        })
      }
    }

    newSocket.on('connect', () => {
      registerAgentRooms()
    })

    newSocket.on('reconnect', () => {
      registerAgentRooms()
    })

    newSocket.on('conversation_updated', (data) => {
      if (data?.conversation) {
        const convId = String(data.conversation._id)
        setActiveChats((prev) => {
          const index = prev.findIndex((c) => String(c._id) === convId)
          if (index !== -1) {
            const updated = [...prev]
            updated[index] = {
              ...updated[index],
              ...data.conversation
            }
            const item = updated.splice(index, 1)[0]
            return [item, ...updated]
          }
          return [data.conversation, ...prev]
        })

        // Auto select if no chat is currently selected
        if (!selectedChatRef.current) {
          setSelectedChat(data.conversation)
        }
      }
    })

    newSocket.on('new_msg', (data) => {
      if (data?.message) {
        const msgConvId = String(data.message.conversationId || data.conversation?._id || '')
        const activeId = selectedChatRef.current?._id ? String(selectedChatRef.current._id) : null

        // Deliver message instantly if active in current agent chat view
        if (activeId && activeId === msgConvId) {
          setChatMessages((prev) => {
            if (prev.some((m) => String(m._id) === String(data.message._id))) return prev
            return [...prev, data.message]
          })
        }

        // Live update active queue item preview and move to top
        setActiveChats((prev) => {
          const index = prev.findIndex((c) => String(c._id) === msgConvId)
          if (index !== -1) {
            const updated = [...prev]
            updated[index] = {
              ...updated[index],
              lastMessage: data.message.text,
              lastMessageAt: data.message.createdAt,
              messageCount: (updated[index].messageCount || 0) + 1
            }
            const item = updated.splice(index, 1)[0]
            return [item, ...updated]
          } else if (data.conversation) {
            return [data.conversation, ...prev]
          }
          return prev
        })

        // If agent has no chat selected yet, auto-select this conversation and load message
        if (!selectedChatRef.current) {
          const targetConv = data.conversation || {
            _id: msgConvId,
            customerName: data.message.senderName || 'Customer',
            customerEmail: data.message.senderEmail || '',
            lastMessage: data.message.text,
            lastMessageAt: data.message.createdAt,
            status: 'active'
          }
          setSelectedChat(targetConv)
          setChatMessages([data.message])
        }

        // Notification alert when message is from customer
        if (data.message.senderRole === 'customer') {
          showToast(`💬 Customer message from ${data.message.senderName || 'Client'}: "${data.message.text.slice(0, 45)}"`)
        }
      }
    })

    newSocket.on('user_typing', (data) => {
      const activeId = selectedChatRef.current?._id ? String(selectedChatRef.current._id) : null
      if (data?.conversationId && String(data.conversationId) === activeId) {
        if (data.senderRole === 'customer') {
          setCustomerIsTyping(Boolean(data.isTyping))
        }
      }
    })

    newSocket.on('chat_reported', (data) => {
      if (data?.conversation) {
        const repConvId = String(data.conversation._id)
        setActiveChats((prev) =>
          prev.map((c) => (String(c._id) === repConvId ? data.conversation : c))
        )
        if (selectedChatRef.current && String(selectedChatRef.current._id) === repConvId) {
          setSelectedChat(data.conversation)
          if (data.systemMessage) {
            setChatMessages((prev) => [...prev, data.systemMessage])
          }
        }
      }
    })

    return () => {
      newSocket.disconnect()
    }
  }, [agentDisplayName, agentDisplayEmail])

  // Load chat messages and join room when selecting a conversation
  useEffect(() => {
    if (!selectedChat?._id) return

    let isMounted = true
    const convId = String(selectedChat._id)
    setCustomerIsTyping(false)

    const loadMessages = async () => {
      try {
        const res = await fetch(`${CHAT_API_URL}/conversations/${convId}/messages`, {
          credentials: 'include'
        })
        if (res.ok && isMounted) {
          const data = await res.json()
          setChatMessages(data.messages || [])
        }
      } catch (err) {
        console.warn('Failed to load chat messages:', err.message)
      }
    }

    loadMessages()

    if (socketRef.current && socketRef.current.connected) {
      const activeRole = activeUser?.role ? String(activeUser.role).toLowerCase() : 'agent'
      socketRef.current.emit('join_conversation', {
        conversationId: convId,
        role: activeRole,
        userName: agentDisplayName,
        userEmail: agentDisplayEmail
      })
    }

    return () => {
      isMounted = false
    }
  }, [selectedChat?._id, agentDisplayName, agentDisplayEmail])

  // Scroll chat messages
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, customerIsTyping])

  // Send message from agent or manager
  const handleSendAgentMessage = (e) => {
    e?.preventDefault()
    if (!agentInputText.trim() || !selectedChat?._id) return

    const text = agentInputText.trim()
    setAgentInputText('')

    const convId = String(selectedChat._id)
    const activeRole = (activeUser?.role === 'manager' || activeUser?.role === 'admin')
      ? activeUser.role
      : 'agent'

    const payload = {
      conversationId: convId,
      senderRole: activeRole,
      senderName: agentDisplayName,
      senderEmail: agentDisplayEmail,
      text
    }

    // Clear typing indicator
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', {
        conversationId: convId,
        senderName: agentDisplayName,
        senderRole: activeRole,
        isTyping: false
      })
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_msg', payload, (ack) => {
        if (ack?.success && ack?.message) {
          setChatMessages((prev) => {
            if (prev.some((m) => String(m._id) === String(ack.message._id))) return prev
            return [...prev, ack.message]
          })
        }
      })
    } else {
      fetch(`${CHAT_API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.message) {
            setChatMessages((prev) => {
              if (prev.some((m) => String(m._id) === String(d.message._id))) return prev
              return [...prev, d.message]
            })
          }
        })
        .catch(console.error)
    }
  }

  const handleAgentInputChange = (e) => {
    const val = e.target.value
    setAgentInputText(val)

    if (socketRef.current && socketRef.current.connected && selectedChat?._id) {
      const convId = String(selectedChat._id)
      const activeRole = (activeUser?.role === 'manager' || activeUser?.role === 'admin')
        ? activeUser.role
        : 'agent'

      socketRef.current.emit('typing', {
        conversationId: convId,
        senderName: agentDisplayName,
        senderRole: activeRole,
        isTyping: val.trim().length > 0
      })

      if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current)
      agentTypingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected && selectedChat?._id) {
          socketRef.current.emit('typing', {
            conversationId: convId,
            senderName: agentDisplayName,
            senderRole: activeRole,
            isTyping: false
          })
        }
      }, 2000)
    }
  }

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
          setCurrentUser((prev) => ({
            ...prev,
            ...data.agent,
            avatar: data.agent.avatar || prev?.avatar || ''
          }))
          if (data.agent.avatar) {
            setAgentAvatar(data.agent.avatar)
          }
          try {
            const stored = localStorage.getItem('crm_user')
            const existing = stored ? JSON.parse(stored) : {}
            localStorage.setItem(
              'crm_user',
              JSON.stringify({ ...existing, ...data.agent, avatar: data.agent.avatar || existing.avatar || '' })
            )
          } catch (e) {}
        }
        setLeads(data.leads || [])
        if (data.kanbanDeals) {
          // Normalize stages for local kanban view
          setDeals(
            data.kanbanDeals.map((d) => ({
              ...d,
              stage: d.stage === 'Won' || d.stage === 'Closed Won' ? 'Deal Won' : d.stage
            }))
          )
        } else {
          setDeals([])
        }
        if (data.tasks) {
          setTasks(data.tasks)
        } else {
          setTasks([])
        }
        if (data.activityLogs) {
          setActivityLogs(data.activityLogs)
        }
      }
    } catch (e) {
      console.warn('Backend sync warning:', e.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle Logout
  const handleLogout = () => {
    if (authLogout) {
      authLogout()
    } else {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
    }
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

  // Filtered Chats in Queue based on search and status
  const filteredChats = useMemo(() => {
    return activeChats.filter((c) => {
      const q = chatSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.customerName?.toLowerCase().includes(q) ||
        c.customerEmail?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)

      const matchesFilter =
        chatFilter === 'all' ||
        (chatFilter === 'active' && c.status === 'active') ||
        (chatFilter === 'reported' && c.status === 'reported_to_manager')

      return matchesSearch && matchesFilter
    })
  }, [activeChats, chatSearch, chatFilter])

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
          <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
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
                {agentRole}
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

            <button
              onClick={() => {
                setCurrentSection('chats')
                fetchAgentChats()
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentSection === 'chats'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>Live Chats</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSection === 'chats' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeChats.filter((c) => c.status === 'active').length}
              </span>
            </button>

            <button
              onClick={() => setCurrentSection('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                currentSection === 'profile'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Profile & Settings</span>
              </div>
            </button>
          </div>
        </div>

        {/* Profile Pill & Sign Out (No User/Staff creation controls) */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <button
              onClick={() => setCurrentSection('profile')}
              className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-80 transition cursor-pointer"
              title="Click to edit profile photo"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {agentAvatar || activeUser?.avatar ? (
                  <img src={agentAvatar || activeUser.avatar} alt="Agent" className="w-full h-full object-cover" />
                ) : (
                  agentInitial
                )}
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-900 text-xs truncate">
                  {agentDisplayName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {agentDisplayEmail}
                </p>
              </div>
            </button>
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
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between gap-3 shadow-xs">
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

          {currentSection === 'chats' ? (
            /* =========================================================================
                REAL-TIME CUSTOMER CHAT & QUALITY AUDIT WORKSPACE
                ========================================================================= */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] max-h-[85vh]">
              
              {/* Left Column: Live Incoming Chat Queue */}
              <div className="w-full md:w-80 border-r border-slate-200/80 flex flex-col shrink-0 bg-slate-50/50">
                {/* Header & Filter Controls */}
                <div className="p-4 border-b border-slate-200/80 bg-white space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-violet-600" />
                      <h3 className="font-extrabold text-sm text-slate-900">Incoming Chat Queue</h3>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activeChats.filter((c) => c.status === 'active').length} Active
                    </span>
                  </div>

                  {/* Search inside queue */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search customer name or email..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="w-full bg-slate-50 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      onClick={() => setChatFilter('all')}
                      className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                        chatFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      All ({activeChats.length})
                    </button>
                    <button
                      onClick={() => setChatFilter('active')}
                      className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                        chatFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      Active ({activeChats.filter((c) => c.status === 'active').length})
                    </button>
                    <button
                      onClick={() => setChatFilter('reported')}
                      className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                        chatFilter === 'reported' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      Audited ({activeChats.filter((c) => c.status === 'reported_to_manager').length})
                    </button>
                  </div>
                </div>

                {/* Queue Items */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredChats.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No customer chats found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Incoming messages from the customer portal will appear here in real time.
                      </p>
                    </div>
                  ) : (
                    filteredChats.map((chat) => {
                      const isSelected = selectedChat?._id === chat._id
                      const isReported = chat.status === 'reported_to_manager'
                      return (
                        <div
                          key={chat._id}
                          onClick={() => setSelectedChat(chat)}
                          className={`p-3.5 transition cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-violet-50/80 border-l-4 border-violet-600'
                              : 'hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {chat.customerName ? chat.customerName[0].toUpperCase() : 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-xs text-slate-900 truncate">
                                {chat.customerName}
                              </p>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {chat.lastMessageAt
                                  ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {chat.lastMessage || 'New incoming conversation'}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full ${
                                  isReported
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isReported ? 'Reported to Manager' : 'Active Chat'}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                {chat.customerEmail}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Two-Way Real-Time Chat Pane */}
              <div className="flex-1 flex flex-col bg-white">
                {!selectedChat ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-base">Select a Customer Conversation</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Choose an active customer session from the queue to start two-way messaging, review details, and file quality reports.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Active Chat Header */}
                    <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {selectedChat.customerName ? selectedChat.customerName[0].toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 leading-tight">
                              {selectedChat.customerName}
                            </h4>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                selectedChat.status === 'reported_to_manager'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {selectedChat.status === 'reported_to_manager' ? 'Reported to Manager' : 'Live Connected'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedChat.customerEmail} {selectedChat.customerPhone ? `• ${selectedChat.customerPhone}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* "End Chat & Submit Report" Action Button */}
                      <div>
                        {selectedChat.status === 'reported_to_manager' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Audited & Reported</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowReportModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition cursor-pointer"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>End Chat & Submit Report</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/70">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400">
                          <p className="font-semibold text-slate-600">No messages in this conversation yet.</p>
                          <p className="mt-0.5">Send a message below to reach out to {selectedChat.customerName}.</p>
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => {
                          const isStaff = msg.senderRole !== 'customer' && msg.senderRole !== 'system'
                          const isSystem = msg.senderRole === 'system'

                          if (isSystem) {
                            return (
                              <div key={msg._id || idx} className="flex justify-center my-2">
                                <span className="bg-amber-100/80 text-amber-900 border border-amber-200/60 rounded-full px-3 py-1 text-[11px] font-semibold max-w-[85%] text-center">
                                  {msg.text}
                                </span>
                              </div>
                            )
                          }

                          const timeStr = msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''

                          return (
                            <div
                              key={msg._id || idx}
                              className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                                  isStaff
                                    ? 'bg-violet-600 text-white rounded-tr-xs'
                                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-2xs'
                                }`}
                              >
                                {!isStaff ? (
                                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                    {msg.senderName} (Customer)
                                  </span>
                                ) : (
                                  msg.senderRole === 'manager' && (
                                    <span className="block text-[10px] font-extrabold text-violet-200 mb-0.5 uppercase tracking-wider">
                                      {msg.senderName} (Management)
                                    </span>
                                  )
                                )}
                                <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                                <span
                                  className={`block text-[9px] mt-1 ${
                                    isStaff ? 'text-violet-200 text-right' : 'text-slate-400 text-left'
                                  }`}
                                >
                                  {timeStr}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}

                      {/* Real-time Customer Typing Indicator */}
                      {customerIsTyping && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs pl-2">
                          <span className="font-semibold text-[11px] text-violet-700">{selectedChat.customerName} is typing</span>
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </span>
                        </div>
                      )}

                      <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Chat Input or Locked Notice */}
                    {selectedChat.status === 'reported_to_manager' ? (
                      <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>This chat session was closed and reported to management. New messages are locked.</span>
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSendAgentMessage}
                        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={agentInputText}
                          onChange={handleAgentInputChange}
                          placeholder={`Message ${selectedChat.customerName}...`}
                          className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
                        />
                        <button
                          type="submit"
                          disabled={!agentInputText.trim()}
                          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : currentSection === 'profile' ? (
            /* =========================================================================
                AGENT PROFILE & AVATAR SETTINGS
                ========================================================================= */
            <div className="space-y-6 animate-fade-in">
              <ProfileAvatarUploader
                avatar={agentAvatar || activeUser?.avatar || ''}
                name={agentDisplayName}
                role={agentRole}
                email={agentDisplayEmail}
                onAvatarChange={handleAgentAvatarChange}
                showToast={showToast}
              />

              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Agent Account & Contact Identity</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Official sales representative credentials and contact details</p>
                  </div>
                  <button
                    onClick={handleSaveAgentProfile}
                    className="px-5 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/25 transition cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={agentDisplayName}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Official Work Email</label>
                    <input
                      type="email"
                      value={agentDisplayEmail}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Sales Role Designation</label>
                    <input
                      type="text"
                      value={agentRole}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Assigned Leads In Queue</label>
                    <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold">
                      {leads.length} Leads Assigned
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{leads.length}</span>
                    <span className="text-xs text-slate-400 font-semibold ml-1.5">Leads</span>
                    <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <span>Database live sync</span>
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
          </>
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

      {/* End Chat & Submit Report Modal */}
      <ChatReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        conversation={selectedChat}
        agentName={agentDisplayName}
        onReportSubmitted={(updatedConversation) => {
          setSelectedChat(updatedConversation)
          setActiveChats((prev) =>
            prev.map((c) => (c._id === updatedConversation._id ? updatedConversation : c))
          )
          showToast('Quality audit report submitted to Management!')
        }}
      />

    </div>
  )
}

export default AgentDashboard
