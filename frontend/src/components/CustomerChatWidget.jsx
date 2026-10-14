import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import {
  MessageSquare,
  X,
  Send,
  Phone,
  Video,
  ShieldCheck,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Clock,
  User,
  AlertCircle,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { CHAT_API_URL, SOCKET_URL } from '../config/api'

const CustomerChatWidget = ({ customer, assignedAgent }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const customerName = customer?.name || customer?.email?.split('@')[0] || 'Customer'
  const customerEmail = customer?.email || 'customer@client.com'
  const agentName = assignedAgent?.name || 'Sara Jenkins'
  const agentRole = assignedAgent?.role || 'Senior CRM Advisor'
  const agentAvatar =
    assignedAgent?.avatar ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'

  // Persistent reference tracking to avoid tearing down socket on state changes
  const conversationRef = useRef(conversation)
  conversationRef.current = conversation

  const customerEmailRef = useRef(customerEmail)
  customerEmailRef.current = customerEmail

  const customerNameRef = useRef(customerName)
  customerNameRef.current = customerName

  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen

  // Initialize or fetch conversation
  useEffect(() => {
    let isMounted = true

    const initChat = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${CHAT_API_URL}/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            customerId: customer?.id || customer?._id || '',
            customerName,
            customerEmail,
            customerPhone: customer?.phone || '',
            agentId: assignedAgent?._id || assignedAgent?.id || '',
            agentName,
            agentEmail: assignedAgent?.email || ''
          })
        })

        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.conversation) {
            setConversation(data.conversation)
            setMessages(data.messages || [])

            // Immediate room join if socket is already connected
            if (socketRef.current && socketRef.current.connected) {
              const convId = String(data.conversation._id)
              socketRef.current.emit('join_conversation', {
                conversationId: convId,
                role: 'customer',
                userName: customerName,
                userEmail: customerEmail
              })
            }
          }
        }
      } catch (err) {
        console.warn('Customer chat init warning:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (customerEmail) {
      initChat()
    }

    return () => {
      isMounted = false
    }
  }, [customerEmail, agentName])

  // Connect and persist Socket.io connection without disconnecting on conversation state updates
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

    const registerRooms = () => {
      const email = customerEmailRef.current
      const name = customerNameRef.current
      const conv = conversationRef.current

      // 1. Identify user personal room
      newSocket.emit('identify', {
        userEmail: email,
        role: 'customer'
      })

      // 2. Join conversation room if available
      if (conv?._id) {
        newSocket.emit('join_conversation', {
          conversationId: String(conv._id),
          role: 'customer',
          userName: name,
          userEmail: email
        })
      }
    }

    newSocket.on('connect', () => {
      setIsConnected(true)
      registerRooms()
    })

    newSocket.on('reconnect', () => {
      setIsConnected(true)
      registerRooms()
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('new_msg', (data) => {
      if (data?.message) {
        const msgConvId = String(data.message.conversationId || data.conversation?._id || '')
        const currentConvId = conversationRef.current?._id ? String(conversationRef.current._id) : ''

        // Deliver message if it matches our session or if session not yet cached locally
        if (!currentConvId || msgConvId === currentConvId) {
          setMessages((prev) => {
            if (prev.some((m) => String(m._id) === String(data.message._id))) return prev
            return [...prev, data.message]
          })

          if (!isOpenRef.current && data.message.senderRole !== 'customer') {
            setUnreadCount((prev) => prev + 1)
          }
        }

        if (data?.conversation) {
          setConversation(data.conversation)
        }
      }
    })

    newSocket.on('chat_reported', (data) => {
      if (data?.conversation) {
        setConversation(data.conversation)
      }
      if (data?.systemMessage) {
        setMessages((prev) => [...prev, data.systemMessage])
      }
    })

    newSocket.on('user_typing', (data) => {
      if (data?.senderRole !== 'customer') {
        setIsTyping(Boolean(data.isTyping))
      }
    })

    const handleCustomOpen = () => {
      setIsOpen(true)
      setIsMinimized(false)
      setUnreadCount(0)
    }
    window.addEventListener('open_customer_chat', handleCustomOpen)

    return () => {
      newSocket.disconnect()
      window.removeEventListener('open_customer_chat', handleCustomOpen)
    }
  }, [customerEmail])

  // Join room when conversation ID becomes available or updates
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && conversation?._id) {
      socketRef.current.emit('join_conversation', {
        conversationId: String(conversation._id),
        role: 'customer',
        userName: customerName,
        userEmail: customerEmail
      })
    }
  }, [conversation?._id, customerEmail, customerName])

  // Scroll chat messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isTyping])

  // Send message handler
  const handleSendMessage = async (e) => {
    e?.preventDefault()
    const text = inputText.trim()
    if (!text) return

    let currentConv = conversation
    if (!currentConv?._id) {
      try {
        const res = await fetch(`${CHAT_API_URL}/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            customerId: customer?.id || customer?._id || '',
            customerName,
            customerEmail,
            customerPhone: customer?.phone || '',
            agentId: assignedAgent?._id || assignedAgent?.id || '',
            agentName,
            agentEmail: assignedAgent?.email || ''
          })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.conversation) {
            currentConv = data.conversation
            setConversation(data.conversation)
            setMessages(data.messages || [])
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('join_conversation', {
                conversationId: String(data.conversation._id),
                role: 'customer',
                userName: customerName,
                userEmail: customerEmail
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to init session before message send:', err)
      }
    }

    if (!currentConv?._id) return

    setInputText('')
    const convId = String(currentConv._id)

    // Stop typing indicator
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', {
        conversationId: convId,
        senderName: customerName,
        senderRole: 'customer',
        isTyping: false
      })
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_msg', {
        conversationId: convId,
        senderRole: 'customer',
        senderName: customerName,
        senderEmail: customerEmail,
        text
      }, (ack) => {
        if (ack?.success && ack?.message) {
          setMessages((prev) => {
            if (prev.some((m) => String(m._id) === String(ack.message._id))) return prev
            return [...prev, ack.message]
          })
        }
      })
    } else {
      // REST fallback if socket temporarily disconnected
      fetch(`${CHAT_API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: convId,
          senderRole: 'customer',
          senderName: customerName,
          senderEmail: customerEmail,
          text
        })
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.message) {
            setMessages((prev) => {
              if (prev.some((m) => String(m._id) === String(d.message._id))) return prev
              return [...prev, d.message]
            })
          }
        })
        .catch(console.error)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputText(val)

    if (socketRef.current && socketRef.current.connected && conversation?._id) {
      socketRef.current.emit('typing', {
        conversationId: String(conversation._id),
        senderName: customerName,
        senderRole: 'customer',
        isTyping: val.trim().length > 0
      })

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected && conversation?._id) {
          socketRef.current.emit('typing', {
            conversationId: String(conversation._id),
            senderName: customerName,
            senderRole: 'customer',
            isTyping: false
          })
        }
      }, 2000)
    }
  }

  const isLocked = conversation?.status === 'reported_to_manager'

  return (
    <>
      {/* =====================================================================
          1. FLOATING LAUNCHER BUTTON (WHATSAPP ACCENT)
          ===================================================================== */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Subtle Tooltip Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-slate-200 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Chat with {agentName.split(' ')[0]}</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true)
              setUnreadCount(0)
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
            title="Open Live Chat with Agent"
            aria-label="Open Live Chat"
          >
            <MessageSquare className="w-7 h-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </button>
        </div>
      )}

      {/* =====================================================================
          2. EXPANDED WHATSAPP-STYLE CHAT WINDOW
          ===================================================================== */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-full sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col transition-all duration-300 font-sans ${
            isMinimized ? 'h-16' : 'h-[540px] max-h-[85vh]'
          }`}
        >
          {/* WhatsApp Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative">
                <img
                  src={agentAvatar}
                  alt={agentName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/60 shadow-xs"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-800 rounded-full"></span>
              </div>
              <div className="truncate text-left">
                <h4 className="font-bold text-sm leading-tight truncate text-white">{agentName}</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span className="truncate">{agentRole}</span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Security Pill Banner */}
              <div className="bg-emerald-50/90 border-b border-emerald-100 px-3.5 py-1.5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 font-medium shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>End-to-end encrypted CRM client session</span>
              </div>

              {/* Chat Message Stream */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]/40"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(200, 215, 205, 0.25) 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              >
                {/* Date separator */}
                <div className="flex justify-center my-1">
                  <span className="bg-white/90 text-slate-500 text-[10px] font-bold px-3 py-0.5 rounded-full shadow-2xs border border-slate-200">
                    Today
                  </span>
                </div>

                {messages.length === 0 && !loading && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    <p className="font-semibold text-slate-600">Connecting with your assigned representative...</p>
                    <p className="text-[11px] mt-1">Send a message to start conversation.</p>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const isMe = msg.senderRole === 'customer'
                  const isSystem = msg.senderRole === 'system'

                  if (isSystem) {
                    return (
                      <div key={msg._id || index} className="flex justify-center my-2">
                        <div className="bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl px-3 py-1.5 text-[11px] max-w-[85%] text-center shadow-xs">
                          <p className="font-semibold">{msg.text}</p>
                        </div>
                      </div>
                    )
                  }

                  const timeStr = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'

                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative leading-relaxed ${
                          isMe
                            ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-emerald-200/50'
                            : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/80 shadow-2xs'
                        }`}
                      >
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[11px] font-bold text-slate-800">
                              {msg.senderName}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                msg.senderRole === 'manager'
                                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                                  : msg.senderRole === 'admin'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {msg.senderRole === 'manager' ? 'Manager' : msg.senderRole === 'admin' ? 'Admin' : 'Advisor'}
                            </span>
                          </div>
                        )}
                        <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 text-[9px] ${
                            isMe ? 'text-emerald-700/80 justify-end' : 'text-slate-400 justify-end'
                          }`}
                        >
                          <span>{timeStr}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-emerald-600 inline" />}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                    <span className="font-semibold text-[11px] text-emerald-700">Staff is typing</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar or Locked Notice */}
              {isLocked ? (
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                    <AlertCircle className="w-4 h-4 text-emerald-600" />
                    <span>Session Concluded & Quality Audited</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Your agent has filed the audit report with management. Start a new ticket if needed.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition cursor-pointer shrink-0 disabled:cursor-not-allowed"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}

export default CustomerChatWidget
