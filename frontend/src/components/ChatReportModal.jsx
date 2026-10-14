import React, { useState } from 'react'
import {
  FileCheck,
  X,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Sparkles
} from 'lucide-react'
import { CHAT_API_URL } from '../config/api'

const ChatReportModal = ({
  isOpen,
  onClose,
  conversation,
  onReportSubmitted,
  agentName
}) => {
  const [summary, setSummary] = useState('')
  const [sentiment, setSentiment] = useState('Positive') // Positive | Neutral | Negative
  const [resolutionStatus, setResolutionStatus] = useState('Resolved') // Resolved | Pending Follow-up | Escalated
  const [agentNotes, setAgentNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen || !conversation) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!summary.trim()) {
      setErrorMsg('Please write a brief summary of the conversation.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const res = await fetch(`${CHAT_API_URL}/conversations/${conversation._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          summary: summary.trim(),
          sentiment,
          resolutionStatus,
          agentNotes: agentNotes.trim(),
          agentName: agentName || conversation.agentName || 'Sales Agent'
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit audit report')
      }

      if (onReportSubmitted) {
        onReportSubmitted(data.conversation)
      }
      onClose()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                End Chat & Submit Audit Report
              </h3>
              <p className="text-xs text-slate-500">
                Customer: <strong className="text-slate-800">{conversation.customerName}</strong> ({conversation.customerEmail})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. Customer Sentiment Pill Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Customer Sentiment Assessment *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'Positive', label: 'Positive', icon: Smile, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold' },
                { id: 'Neutral', label: 'Neutral', icon: Meh, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-500 text-amber-800 font-bold' },
                { id: 'Negative', label: 'Negative', icon: Frown, color: 'text-rose-600', activeBg: 'bg-rose-50 border-rose-500 text-rose-800 font-bold' }
              ].map((item) => {
                const Icon = item.icon
                const isSelected = sentiment === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSentiment(item.id)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? item.activeBg
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Issue / Resolution Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Issue & Deal Resolution Status *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'Resolved', label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold' },
                { id: 'Pending Follow-up', label: 'Pending Follow-up', icon: Clock, color: 'text-indigo-600', activeBg: 'bg-indigo-50 border-indigo-500 text-indigo-800 font-bold' },
                { id: 'Escalated', label: 'Escalated to Mgmt', icon: AlertTriangle, color: 'text-rose-600', activeBg: 'bg-rose-50 border-rose-500 text-rose-800 font-bold' }
              ].map((item) => {
                const Icon = item.icon
                const isSelected = resolutionStatus === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setResolutionStatus(item.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] transition cursor-pointer text-center ${
                      isSelected
                        ? item.activeBg
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Conversation Summary */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Conversation Summary & Key Takeaways *
            </label>
            <textarea
              rows={3}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="E.g., Client inquired about enterprise migration tier. Quoted $14,500 annual plan; client requested follow-up meeting on Friday."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-600 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* 4. Internal Agent Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Internal Manager Notes (Optional)
            </label>
            <input
              type="text"
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Any sensitive context or next recommended step for the manager..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-600 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Notice banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <span>
              Submitting marks the conversation as <strong>Reported to Manager</strong> and archives the transcript to the Management Audit screen.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !summary.trim()}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Filing Report...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Submit Quality Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatReportModal
