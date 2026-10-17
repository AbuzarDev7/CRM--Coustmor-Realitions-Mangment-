import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Building,
  CheckCircle,
  AlertCircle,
  Send,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  DollarSign
} from 'lucide-react'
import { LEADS_API_URL } from '../config/api'

const PublicCompanyForm = () => {
  const { companySlug } = useParams()

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Form inputs
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    message: ''
  })
  const [customFields, setCustomFields] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submittedLead, setSubmittedLead] = useState(null)

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setLoading(true)
        setFetchError('')
        const res = await fetch(`${LEADS_API_URL}/public/company/${encodeURIComponent(companySlug)}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load company workspace')
        }

        setCompany(data.company)

        // Initialize custom fields with default values from policy
        if (data.company?.policy?.fields) {
          const initial = {}
          data.company.policy.fields.forEach((f) => {
            initial[f.key] = f.default || ''
          })
          setCustomFields(initial)
        }
      } catch (err) {
        setFetchError(err.message || 'Company portal unavailable')
      } finally {
        setLoading(false)
      }
    }

    if (companySlug) {
      fetchCompanyProfile()
    }
  }, [companySlug])

  const handleBaseChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (submitError) setSubmitError('')
  }

  const handleCustomChange = (e) => {
    setCustomFields((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        ...customFields,
        companySlug
      }

      const res = await fetch(`${LEADS_API_URL}/public/${encodeURIComponent(companySlug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry')
      }

      setSubmittedLead(data)
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit inquiry')
    } finally {
      setSubmitting(false)
    }
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Connecting to Workspace...</h2>
        <p className="text-xs text-slate-400 mt-1">Resolving company tenant details</p>
      </div>
    )
  }

  // 2. Error / Company Not Found State
  if (fetchError || !company) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Company Workspace Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {fetchError || `We couldn't locate any active company workspace with the identifier "${companySlug}".`}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition"
            >
              <span>Return to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const policy = company.policy || {}
  const industryKey = company.industryType || company.businessType || 'real_estate'

  const industryBadge =
    industryKey === 'real_estate' ? '🏢 Real Estate & Property' :
    industryKey === 'restaurant' ? '🍽️ Restaurant & Dining' :
    industryKey === 'automotive' ? '🚗 Automotive Dealership' :
    industryKey === 'services' ? '💼 Professional Services' :
    industryKey === 'retail' ? '🛍️ Retail & Commerce' : '🌐 Business Workspace'

  const heroSubtitle =
    industryKey === 'real_estate' ? 'Connect with our property consultants to schedule visits, receive pricing catalogs, and reserve homes.' :
    industryKey === 'restaurant' ? 'Book a table, organize private dining events, or request custom catering services.' :
    industryKey === 'automotive' ? 'Book a VIP test drive, inquire about vehicle inventory, or get customized financing options.' :
    industryKey === 'services' ? 'Schedule a discovery session with our specialists and receive a custom proposal for your project.' :
    'Submit your inquiry directly to our team and receive prompt assistance.'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-tight block">
                {company.companyName}
              </span>
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider block">
                {industryBadge}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Direct Tenant Routing • Verified Portal</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 my-auto">
        {submittedLead ? (
          /* Confirmation Success Card */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block mb-3">
                Inquiry Routed Successfully
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Thank You, {formData.clientName}!
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Your inquiry has been directly assigned to the manager at{' '}
                <strong className="text-white">{company.companyName}</strong>. Our assigned representative will contact you via email or phone shortly.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Company Workspace:</span>
                <span className="text-white font-bold">{company.companyName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Client Email:</span>
                <span className="text-violet-300 font-bold">{formData.email}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tenant Routing Status:</span>
                <span className="text-emerald-400 font-bold">Manager Queue Assigned</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedLead(null)
                  setFormData({ clientName: '', email: '', phone: '', message: '' })
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          /* Public Dynamic Inquiry Form */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8 animate-fade-in">
            {/* Header / Hero */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{industryBadge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {company.companyName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                {heroSubtitle}
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: Personal Contact Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  <span>1. Your Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="clientName"
                        required
                        value={formData.clientName}
                        onChange={handleBaseChange}
                        placeholder="e.g. Alexander Vance"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleBaseChange}
                        placeholder="alexander@example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleBaseChange}
                        placeholder="+1 (555) 019-2834"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Dynamic Industry Policy Fields */}
              {policy.fields && policy.fields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>2. Inquiry Requirements ({policy.label || 'Details'})</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {policy.fields.map((field) => {
                      if (field.type === 'select') {
                        return (
                          <div key={field.key} className={field.options.length > 4 ? 'sm:col-span-2' : ''}>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              {field.label}
                            </label>
                            <select
                              name={field.key}
                              value={customFields[field.key] || field.default || ''}
                              onChange={handleCustomChange}
                              className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium cursor-pointer"
                            >
                              {field.options.map((opt) => (
                                <option key={opt} value={opt} className="bg-slate-900 text-white">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      }

                      return (
                        <div key={field.key}>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            {field.label}
                          </label>
                          <input
                            type={field.type || 'text'}
                            name={field.key}
                            value={customFields[field.key] || ''}
                            onChange={handleCustomChange}
                            placeholder={field.placeholder || ''}
                            className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: Message / Notes */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300">
                  Additional Notes or Specific Requirements
                </label>
                <textarea
                  name="message"
                  rows="3"
                  value={formData.message}
                  onChange={handleBaseChange}
                  placeholder="Provide any specific requests, preferred timing, or questions for our team..."
                  className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-violet-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Routing Inquiry to Manager...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry to {company.companyName}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-[11px] text-slate-500">
        <span>Powered by Multi-Tenant SaaS CRM Platform • Isolated Workspace Routing</span>
      </footer>
    </div>
  )
}

export default PublicCompanyForm
