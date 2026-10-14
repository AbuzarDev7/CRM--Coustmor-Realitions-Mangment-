import React, { useState, useEffect } from 'react'
import {
  FileText,
  X,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Shield,
  MessageSquare,
  Calendar,
  Download,
  Copy,
  Check,
  Send
} from 'lucide-react'
import { io } from 'socket.io-client'
import { CHAT_API_URL, SOCKET_URL } from '../config/api'

const ChatTranscriptModal = ({ isOpen, onClose, conversationId }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [managerReplyText, setManagerReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [replyError, setReplyError] = useState('')

  useEffect(() => {
    if (!isOpen || !conversationId) return

    let isMounted = true
    const fetchTranscript = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${CHAT_API_URL}/manager/transcripts/${conversationId}`, {
          credentials: 'include'
        })
        if (res.ok && isMounted) {
          const resData = await res.json()
          setData(resData)
        }
      } catch (err) {
        console.error('Fetch transcript error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTranscript()

    // Real-Time Socket Connection to listen for new messages live
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    })

    socket.on('connect', () => {
      socket.emit('join_conversation', {
        conversationId: String(conversationId),
        role: 'manager'
      })
    })

    socket.on('new_msg', (newMsgData) => {
      if (newMsgData?.message) {
        const msgConvId = String(newMsgData.message.conversationId || newMsgData.conversation?._id || '')
        if (msgConvId === String(conversationId)) {
          setData((prev) => {
            if (!prev) return prev
            const exists = (prev.messages || []).some(
              (m) => String(m._id) === String(newMsgData.message._id)
            )
            if (exists) return prev
            return {
              ...prev,
              messages: [...(prev.messages || []), newMsgData.message]
            }
          })
        }
      }
    })

    return () => {
      isMounted = false
      socket.disconnect()
    }
  }, [isOpen, conversationId])

  const handleSendManagerReply = async (e) => {
    e?.preventDefault()
    if (!managerReplyText.trim() || !conversationId) return

    try {
      setSendingReply(true)
      setReplyError('')

      let mgrName = 'Operations Manager'
      let mgrEmail = 'manager@onesoft.com'
      try {
        const storedUser = JSON.parse(localStorage.getItem('crm_user') || '{}')
        if (storedUser?.name) mgrName = storedUser.name
        if (storedUser?.email) mgrEmail = storedUser.email
      } catch (e) {
        console.error(e)
      }

      const res = await fetch(`${CHAT_API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: String(conversationId),
          senderRole: 'manager',
          senderName: mgrName,
          senderEmail: mgrEmail,
          text: managerReplyText.trim()
        })
      })

      const d = await res.json()
      if (res.ok && d.message) {
        setData((prev) => {
          if (!prev) return prev
          const exists = (prev.messages || []).some((m) => String(m._id) === String(d.message._id))
          if (exists) return prev
          return {
            ...prev,
            messages: [...(prev.messages || []), d.message]
          }
        })
        setManagerReplyText('')
      } else {
        setReplyError(d.error || 'Failed to send manager message')
      }
    } catch (err) {
      setReplyError(err.message)
    } finally {
      setSendingReply(false)
    }
  }

  if (!isOpen) return null

  const conversation = data?.conversation
  const messages = data?.messages || []

  const handleCopyTranscript = () => {
    if (!messages.length) return
    const text = messages
      .map(
        (m) =>
          `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.senderName} (${m.senderRole}): ${m.text}`
      )
      .join('\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const sentiment = conversation?.report?.sentiment || 'Positive'
  const resolution = conversation?.report?.resolutionStatus || 'Resolved'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fade-in font-sans">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                  Chat Quality Audit & Transcript
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  Audit Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Session ID: <code className="text-slate-700">{conversationId}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTranscript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-semibold transition"
              title="Copy plain text transcript"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
              <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading complete audit transcript...</span>
            </div>
          </div>
        ) : !conversation ? (
          <div className="flex-1 p-8 text-center text-slate-400 text-sm">
            Chat transcript not found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Top Meta Details & Quality Audit Cards */}
            <div className="p-6 bg-slate-50/50 border-b border-slate-200/80 space-y-4">
              
              {/* Customer & Agent Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Account
                  </span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{conversation.customerName}</p>
                  <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span>{conversation.customerEmail}</span>
                  </p>
                  {conversation.customerPhone && (
                    <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{conversation.customerPhone}</span>
                    </p>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Handling Sales Agent
                  </span>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{conversation.agentName}</p>
                  <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span>{conversation.agentEmail || 'agent@onesoft.com'}</span>
                  </p>
                  <p className="text-slate-400 text-[10px] mt-1">
                    {messages.length} messages exchanged
                  </p>
                </div>
              </div>

              {/* Agent's Submitted Audit Report */}
              <div className="p-4 bg-white rounded-2xl border border-violet-100 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-violet-600" />
                    <span>Agent's Filed Quality Report</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Sentiment Tag */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        sentiment === 'Positive'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sentiment === 'Negative'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sentiment === 'Positive' && <Smile className="w-3 h-3 text-emerald-600" />}
                      {sentiment === 'Neutral' && <Meh className="w-3 h-3 text-amber-600" />}
                      {sentiment === 'Negative' && <Frown className="w-3 h-3 text-rose-600" />}
                      <span>{sentiment}</span>
                    </span>

                    {/* Resolution Tag */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        resolution === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : resolution === 'Escalated'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {resolution}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 font-semibold mb-0.5">Conversation Summary:</p>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {conversation.report?.summary || 'No summary filed.'}
                  </p>
                </div>

                {conversation.report?.agentNotes && (
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold mb-0.5">Internal Agent Notes:</p>
                    <p className="text-xs text-slate-600 italic">
                      "{conversation.report.agentNotes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript Messages Stream */}
            <div className="p-6 space-y-3.5 bg-[#f8fafc] flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs text-slate-500 font-semibold">
                <span>Chronological Message Transcript ({messages.length})</span>
                <span>
                  {conversation.startedAt && new Date(conversation.startedAt).toLocaleDateString()}
                </span>
              </div>

              {messages.map((msg, idx) => {
                const isCustomer = msg.senderRole === 'customer'
                const isSystem = msg.senderRole === 'system'

                if (isSystem) {
                  return (
                    <div key={msg._id || idx} className="flex justify-center my-2">
                      <div className="bg-slate-200/70 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full text-center">
                        {msg.text}
                      </div>
                    </div>
                  )
                }

                const timeStr = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs border ${
                        isCustomer
                          ? 'bg-white border-slate-200 text-slate-900 rounded-tl-xs'
                          : 'bg-violet-50 border-violet-200 text-slate-900 rounded-tr-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span
                          className={`text-[11px] font-extrabold ${
                            isCustomer
                              ? 'text-emerald-700'
                              : msg.senderRole === 'manager'
                              ? 'text-purple-700'
                              : 'text-violet-700'
                          }`}
                        >
                          {msg.senderName} ({isCustomer ? 'Customer' : msg.senderRole === 'manager' ? 'Management' : 'Agent'})
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{timeStr}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-800">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* Manager Real-Time Quick Reply Composer & Drawer Footer */}
        <div className="border-t border-slate-200 bg-slate-50/80 p-3.5 shrink-0">
          {conversation?.status === 'reported_to_manager' ? (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 py-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                Session is finalized and quality-audited.
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition text-xs cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendManagerReply} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={managerReplyText}
                  onChange={(e) => setManagerReplyText(e.target.value)}
                  placeholder={`Send direct management message to ${conversation?.customerName || 'customer'}...`}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !managerReplyText.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Sending...' : 'Send'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 font-semibold transition text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
              {replyError && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{replyError}</p>
              )}
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

export default ChatTranscriptModal
