import React, { useState } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  Tag,
  Building,
  DollarSign,
  FileText,
  UserCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { LEADS_API_URL } from '../config/api'

const SOURCE_OPTIONS = [
  { value: 'Facebook', label: 'Facebook Ads / Meta' },
  { value: 'Instagram', label: 'Instagram Direct / Campaign' },
  { value: 'WhatsApp', label: 'WhatsApp Inquiry' },
  { value: 'Direct Call', label: 'Direct Phone Call / Walk-in' },
  { value: 'Website', label: 'Website Inquiry' }
]

const PROPERTY_TYPES = [
  'Residential',
  'Commercial',
  'Villa / Luxury Estate',
  'Apartment / Penthouse',
  'Plots & Land',
  'Industrial'
]

const ManualLeadModal = ({ isOpen, onClose, onLeadCreated, agents = [] }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    source: 'Facebook',
    propertyType: 'Residential',
    budget: '',
    requirements: '',
    assignedAgent: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.clientName.trim()) {
      setErrorMsg('Client name is required')
      return
    }

    if (!formData.email.trim()) {
      setErrorMsg('Client email address is required')
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const payload = {
        name: formData.clientName.trim(),
        clientName: formData.clientName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        source: formData.source,
        propertyType: formData.propertyType,
        budget: formData.budget.trim(),
        requirements: formData.requirements.trim(),
        message: formData.requirements.trim(),
        assignedAgent: formData.assignedAgent && formData.assignedAgent !== 'unassigned' ? formData.assignedAgent : null,
        status: 'New'
      }

      const res = await fetch(`${LEADS_API_URL}/create-manual`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create manual lead')
      }

      // Reset form
      setFormData({
        clientName: '',
        email: '',
        phone: '',
        source: 'Facebook',
        propertyType: 'Residential',
        budget: '',
        requirements: '',
        assignedAgent: ''
      })

      if (onLeadCreated) {
        onLeadCreated(data.lead)
      }
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while saving lead')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Add Manual Property Lead</h3>
              <p className="text-[11px] text-slate-400">Capture leads from Facebook, Instagram, WhatsApp, or phone calls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Client Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Client Name *</span>
              </label>
              <input
                type="text"
                name="clientName"
                required
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g. David Sterling"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
              />
            </div>
          </div>

          {/* Email Address & Lead Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="client@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Lead Source *</span>
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium cursor-pointer"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Property Type & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Property Type</span>
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium cursor-pointer"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Estimated Budget</span>
              </label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="e.g. $450,000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
              />
            </div>
          </div>

          {/* Property Requirements */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Property Requirements / Notes</span>
            </label>
            <textarea
              name="requirements"
              rows={3}
              value={formData.requirements}
              onChange={handleChange}
              placeholder="e.g. Inquired via Facebook Ad about 4-bedroom villa with private pool. Prefers weekend viewings."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs resize-none"
            />
          </div>

          {/* Optional Direct Agent Assignment */}
          {agents && agents.length > 0 && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Assign to Sales Agent (Optional)</span>
              </label>
              <select
                name="assignedAgent"
                value={formData.assignedAgent}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium cursor-pointer"
              >
                <option value="">Leave Unassigned (Routes to Manager Queue)</option>
                {agents.map((ag) => (
                  <option key={ag._id || ag.id} value={ag._id || ag.id}>
                    Assign to: {ag.name} ({ag.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Lead...</span>
                </>
              ) : (
                <span>+ Save & Ingest Lead</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManualLeadModal
