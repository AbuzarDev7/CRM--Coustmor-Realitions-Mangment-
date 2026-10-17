import React, { useState } from 'react'
import {
  X,
  Building,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  Copy,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { COMPANIES_API_URL } from '../config/api'

const BUSINESS_TYPES = [
  { value: 'real_estate', label: '🏢 Real Estate & Property', desc: 'Property listings, site visits & buyer inquiries' },
  { value: 'restaurant', label: '🍽️ Restaurant & Hospitality', desc: 'Reservations, private dining & event leads' },
  { value: 'automotive', label: '🚗 Automotive & Dealership', desc: 'Test drives, inventory inquiries & sales' },
  { value: 'services', label: '💼 Professional Services', desc: 'Consulting, legal, agencies & B2B accounts' },
  { value: 'retail', label: '🛍️ Retail & E-Commerce', desc: 'Product inquiries, wholesale & customer orders' },
  { value: 'other', label: '🌐 Other Enterprise', desc: 'Custom industry CRM workflows' }
]

const CreateCompanyModal = ({ isOpen, onClose, onCompanyCreated }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: 'real_estate',
    adminName: '',
    adminEmail: '',
    adminPassword: 'Admin@' + Math.floor(1000 + Math.random() * 9000),
    contactPhone: '',
    address: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdData, setCreatedData] = useState(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('crm_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(COMPANIES_API_URL, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create company and admin account')
      }

      setCreatedData({
        company: data.company,
        credentials: data.adminCredentials
      })

      if (onCompanyCreated) {
        onCompanyCreated(data.company)
      }
    } catch (err) {
      setError(err.message || 'Network error while creating company')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!createdData) return
    const text = `Company: ${createdData.company?.companyName}\nAdmin Login URL: ${window.location.origin}/login\nEmail: ${createdData.credentials?.email}\nPassword: ${createdData.credentials?.initialPassword}\nRole: Company Admin`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleResetAndClose = () => {
    setCreatedData(null)
    setFormData({
      companyName: '',
      businessType: 'real_estate',
      adminName: '',
      adminEmail: '',
      adminPassword: 'Admin@' + Math.floor(1000 + Math.random() * 9000),
      contactPhone: '',
      address: ''
    })
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-violet-600 to-indigo-700 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Provision New Company & Admin</h2>
              <p className="text-xs text-violet-200">Independent SaaS Tenant with dedicated Company Admin</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {createdData ? (
            /* Success & Credentials Display View */
            <div className="space-y-5 animate-fade-in text-center py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {createdData.company?.companyName} Created!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  The company account and Company Admin owner credentials are ready.
                </p>
              </div>

              {/* Credentials Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-200/80 pb-2">
                  <span className="font-sans font-bold text-slate-700">Company Admin Credentials</span>
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 font-bold rounded-md uppercase text-[10px]">
                    Role: company_admin
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Login Portal:</span>
                  <span className="font-semibold text-slate-800">{window.location.origin}/login</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-slate-900">{createdData.credentials?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Temporary Password:</span>
                  <span className="font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                    {createdData.credentials?.initialPassword}
                  </span>
                </div>
              </div>

              {/* Copy & Finish Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-violet-400" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Login Details'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Company Profile */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-violet-600" />
                  <span>1. Company Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Skyline Premier Realty"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Type / Industry
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium text-slate-800"
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {bt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Company Admin Account */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Company Admin (Owner) Account</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="adminName"
                        value={formData.adminName}
                        onChange={handleChange}
                        placeholder="e.g. Tariq Mehmood"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Email (Login ID) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        name="adminEmail"
                        required
                        value={formData.adminEmail}
                        onChange={handleChange}
                        placeholder="admin@skyline.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="adminPassword"
                        required
                        value={formData.adminPassword}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="+92 300 1234567"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-violet-500/20 transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Provisioning Company...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Company & Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateCompanyModal
