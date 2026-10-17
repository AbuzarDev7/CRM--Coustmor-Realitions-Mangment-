import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Radio,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'
import { LEADS_API_URL } from '../config/api'
import {
  SocialBadge,
  getSocialIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon
} from './SocialIcons'

const LeadAnalyticsWidget = () => {
  // Live Data States (Zero-mock real database state)
  const [sources, setSources] = useState([])
  const [summary, setSummary] = useState({
    totalLeads: 0,
    closedWonCount: 0,
    overallConversionRate: 0,
    totalPipelineValue: 0,
    topSource: 'None'
  })
  const [leadsList, setLeadsList] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)

  // Filter States
  const [channelFilter, setChannelFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Panels
  const [showManualModal, setShowManualModal] = useState(false)
  const [showWebhookGuide, setShowWebhookGuide] = useState(false)
  const [simulating, setSimulating] = useState(false)

  // Manual Lead Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Facebook',
    estimatedValue: 3500,
    status: 'New',
    notes: ''
  })

  const showNotification = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch Live Analytics & Ingested Leads
  const fetchLeadAnalytics = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true)
    try {
      // 1. Fetch Source Analytics ($group aggregation)
      const analyticsRes = await fetch(`${LEADS_API_URL}/source-analytics`)
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setSources(data.sources || [])
        setSummary(data.summary || {
          totalLeads: 0,
          closedWonCount: 0,
          overallConversionRate: 0,
          totalPipelineValue: 0,
          topSource: 'None'
        })
      }

      // 2. Fetch Leads List
      const listRes = await fetch(`${LEADS_API_URL}?limit=40`)
      if (listRes.ok) {
        const listData = await listRes.json()
        if (listData.leads) {
          setLeadsList(listData.leads)
        }
      }
    } catch (err) {
      console.warn('Live lead analytics fetch error:', err.message)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLeadAnalytics()
  }, [])

  // Manual Lead Entry Handler (POST /api/leads/create)
  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualForm.name.trim() || !manualForm.email.trim()) {
      showNotification('Please enter customer full name and email.', 'error')
      return
    }

    try {
      const res = await fetch(`${LEADS_API_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create manual lead')
      }

      showNotification(`Lead "${manualForm.name}" created and tagged with source: ${manualForm.source}!`)
      setShowManualModal(false)
      setManualForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'Facebook',
        estimatedValue: 3500,
        status: 'New',
        notes: ''
      })
      await fetchLeadAnalytics(true)
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  // Webhook Simulator Handler (Simulates incoming Meta Facebook / Instagram Leadgen)
  const handleSimulateWebhook = async (platform = 'Facebook') => {
    setSimulating(true)
    try {
      const mockLeadNames = {
        Facebook: [
          { name: 'Marcus Sterling', company: 'Sterling Logistics LLC', email: 'm.sterling@sterlinglog.com', val: 7800 },
          { name: 'Elena Rostova', company: 'Nova Growth Partners', email: 'elena@novagrowth.io', val: 12500 }
        ],
        Instagram: [
          { name: 'Chloe Davenport', company: 'Aesthetic Studios NY', email: 'chloe@aestheticdesign.co', val: 4200 },
          { name: 'Liam O’Connor', company: 'Apex Digital Agency', email: 'liam@apexdigital.tech', val: 6500 }
        ],
        LinkedIn: [
          { name: 'David Zhao', company: 'Apex Capital Partners', email: 'david.zhao@apexcapital.org', val: 14200 },
          { name: 'Sarah Jenkins', company: 'CloudScale Enterprises', email: 's.jenkins@cloudscale.io', val: 18500 }
        ],
        Twitter: [
          { name: 'Devon Miller', company: 'HyperScale AI Devs', email: 'devon@hyperscale.dev', val: 5600 },
          { name: 'Zara Vance', company: 'FinTech Pulse Labs', email: 'zara@fintechpulse.io', val: 8900 }
        ]
      }

      const sample = mockLeadNames[platform][Math.floor(Math.random() * mockLeadNames[platform].length)]

      const res = await fetch(`${LEADS_API_URL}/simulate-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          name: sample.name,
          email: sample.email,
          phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
          company: sample.company,
          estimatedValue: sample.val
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulation failed')

      showNotification(`⚡ Live Ingestion: Captured real-time ${platform} lead for "${sample.name}"!`)
      await fetchLeadAnalytics(true)
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setSimulating(false)
    }
  }

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      const s = searchQuery.toLowerCase()
      const matchesSearch =
        !s ||
        (lead.name && lead.name.toLowerCase().includes(s)) ||
        (lead.email && lead.email.toLowerCase().includes(s)) ||
        (lead.company && lead.company.toLowerCase().includes(s))

      if (!matchesSearch) return false

      if (channelFilter === 'all') return true
      return (lead.source || '').toLowerCase().includes(channelFilter.toLowerCase())
    })
  }, [leadsList, searchQuery, channelFilter])

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          1. TOP BANNER: INGESTION CONTROLS & ACTIONS
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1.5 px-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Live Stream Active
                </span>
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Meta Graph Webhook Live</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lead Ingestion & Social Channel Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Automated lead capture from Facebook & Instagram Instant Forms via Meta Graph API, plus manual entry fallback and live conversion analytics.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchLeadAnalytics()}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-violet-600' : ''}`} />
            </button>

            <button
              onClick={() => setShowWebhookGuide(!showWebhookGuide)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              <span>Webhook Config</span>
            </button>

            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Manual Lead</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Toolbar Sub-Strip */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Simulate Incoming Social Webhook:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSimulateWebhook('Facebook')}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              title="Simulate real-time Facebook Leadgen submission"
            >
              <FacebookIcon className="w-3.5 h-3.5" color="#1877F2" />
              <span>+ Facebook Lead</span>
            </button>

            <button
              onClick={() => handleSimulateWebhook('Instagram')}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 border border-pink-200 hover:bg-pink-100 text-pink-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              title="Simulate real-time Instagram Leadgen submission"
            >
              <InstagramIcon className="w-3.5 h-3.5" color="#E4405F" />
              <span>+ Instagram Lead</span>
            </button>

            <button
              onClick={() => handleSimulateWebhook('LinkedIn')}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              title="Simulate real-time LinkedIn Leadgen submission"
            >
              <LinkedInIcon className="w-3.5 h-3.5" color="#0A66C2" />
              <span>+ LinkedIn Lead</span>
            </button>

            <button
              onClick={() => handleSimulateWebhook('Twitter')}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              title="Simulate real-time Twitter / X Leadgen submission"
            >
              <TwitterIcon className="w-3.5 h-3.5" color="#0f172a" />
              <span>+ X / Twitter Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COLLAPSIBLE WEBHOOK SETUP & ENV GUIDE PANEL
          ========================================================================= */}
      {showWebhookGuide && (
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl border border-slate-800 space-y-4 animate-scale-up text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
                <Radio className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white">
                Meta (Facebook & Instagram) Graph API Webhook Setup Guide
              </h3>
            </div>
            <button
              onClick={() => setShowWebhookGuide(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
              <span className="font-bold text-white block">1. Webhook Endpoint URLs</span>
              <p className="text-slate-400">
                Register these endpoints inside Meta App Dashboard &rarr; <strong>Webhooks &rarr; Page</strong>:
              </p>
              <div className="space-y-1 font-mono text-[11px] text-violet-300 bg-slate-950 p-2.5 rounded-lg">
                <div>Callback URL: <span className="text-white">https://your-crm-domain.com/api/webhooks/meta</span></div>
                <div>Verify Token: <span className="text-emerald-400">crm_meta_webhook_secret_token</span></div>
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
              <span className="font-bold text-white block">2. Required Environment Variables</span>
              <p className="text-slate-400">
                Add to your backend <code className="text-violet-300">.env</code> file:
              </p>
              <pre className="font-mono text-[11px] text-emerald-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto">
{`META_VERIFY_TOKEN=crm_meta_webhook_secret_token
META_PAGE_ACCESS_TOKEN=your_facebook_page_access_token`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. KEY KPI SUMMARY CARDS (Consistent bg-white rounded-xl border border-slate-200)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Total Ingested Leads */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ingested Leads
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {summary.totalLeads}
            </div>
            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Multi-Channel Active</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Closed Won Deals */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Closed / Won Deals
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {summary.closedWonCount}
            </div>
            <div className="text-xs text-slate-500">
              Across all social channels
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Conversion Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overall Win Rate
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {summary.overallConversionRate}%
            </div>
            <div className="text-xs text-slate-500">
              Avg across {sources.length} sources
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Total Pipeline Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pipeline Est. Value
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ${(summary.totalPipelineValue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              Top: <strong className="text-slate-800">{summary.topSource}</strong>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. MAIN ANALYTICS ROW: RECHARTS DONUT + SOURCE PERFORMANCE TABLE
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* RECHARTS DONUT/PIE CHART (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Acquisition Channel Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportion of total leads per social source
                </p>
              </div>
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                Live Channels
              </span>
            </div>

            {/* Donut Chart */}
            {sources.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mt-4">
                <Users className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Lead Sources Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Incoming Meta, LinkedIn, and forms leads will categorize automatically</p>
              </div>
            ) : (
              <div className="h-64 w-full relative mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                              <p className="font-bold text-sm text-violet-300">{d.name}</p>
                              <p className="text-slate-300">Total Leads: <strong className="text-white">{d.totalLeads}</strong></p>
                              <p className="text-slate-300">Closed / Won: <strong className="text-emerald-400">{d.closedWonCount}</strong></p>
                              <p className="text-slate-300">Conversion Rate: <strong className="text-amber-400">{d.conversionRate}%</strong></p>
                              <p className="text-slate-400 text-[11px]">Est. Value: ${d.totalValue?.toLocaleString()}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Centered Total Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {summary.totalLeads}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                    Leads
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Official Social Media Channel Legend */}
          {sources.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
              {sources.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {getSocialIcon(s.name || s.source, 'w-3.5 h-3.5')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 truncate font-semibold text-xs">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.totalLeads} leads</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOURCE PERFORMANCE TABLE (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Channel Conversion & ROI Table
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated via MongoDB <code className="text-violet-600 font-semibold">$group</code> pipeline
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mt-4 rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                    <th className="px-6 py-4 text-left">Acquisition Channel</th>
                    <th className="px-6 py-4 text-center">Total Ingested</th>
                    <th className="px-6 py-4 text-center">Won / Closed</th>
                    <th className="px-6 py-4 text-right">Pipeline ($)</th>
                    <th className="px-6 py-4 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sources.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                        No social lead channel data in database yet. Ingested leads will appear here.
                      </td>
                    </tr>
                  ) :
                    sources.map((src, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 text-left text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            {getSocialIcon(src.name || src.source, 'w-4 h-4')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{src.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{src.source} network</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 text-sm whitespace-nowrap">
                        {src.totalLeads}
                      </td>
                      <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                          <Check className="w-3 h-3" />
                          {src.closedWonCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700 font-mono font-bold text-sm whitespace-nowrap">
                        ${(src.totalValue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(src.conversionRate || 0, 100)}%`,
                                backgroundColor: src.color || '#6366f1'
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-900 text-xs w-10 text-right">
                            {src.conversionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          4. RECENT INGESTED LEADS QUEUE TABLE (Full Width Responsive Table)
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        
        {/* Table Top Header: Title & Filters cleanly aligned */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Live Ingested Leads Feed
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Incoming customer inquiries from Facebook Instant Forms, Instagram, LinkedIn, Twitter/X, and WhatsApp.
            </p>
          </div>

          {/* Search & Channel Filter */}
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter / X</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
            </select>
          </div>
        </div>

        {/* Feed Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-xs border-b border-slate-200">
                <th className="px-6 py-4 text-left">Lead Name / Contact</th>
                <th className="px-6 py-4 text-left">Organization</th>
                <th className="px-6 py-4 text-left">Acquisition Channel</th>
                <th className="px-6 py-4 text-right">Est. Value</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-left text-sm whitespace-nowrap">
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{lead.email}</span>
                          {lead.phone && (
                            <>
                              <span>•</span>
                              <span>{lead.phone}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-medium text-slate-700 whitespace-nowrap">
                        {lead.company || 'Individual Client'}
                      </td>
                      <td className="px-6 py-4 text-left text-sm whitespace-nowrap">
                        <SocialBadge source={lead.source} />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 font-mono whitespace-nowrap">
                        ${(lead.estimatedValue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            (lead.status || '').toLowerCase() === 'new'
                              ? 'bg-violet-50 text-violet-700 border border-violet-200'
                              : (lead.status || '').toLowerCase().includes('won') ||
                                (lead.status || '').toLowerCase().includes('convert')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-500 font-mono whitespace-nowrap">
                        {new Date(lead.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No leads matching your current channel or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: MANUAL LEAD ENTRY FALLBACK (POST /api/leads/create)
          ========================================================================= */}
      {showManualModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowManualModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Add Manual Lead (Walk-in / Offline)
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jessica Taylor"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jessica@taylorcorp.com"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (415) 555-0199"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="Acme Tech Group"
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Acquisition Source Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Acquisition Source <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={manualForm.source}
                    onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="Facebook">Facebook (Ad / Page)</option>
                    <option value="Instagram">Instagram (Ad / Direct)</option>
                    <option value="LinkedIn">LinkedIn (InMail / Profile)</option>
                    <option value="Twitter">Twitter / X (Promoted / Campaign)</option>
                    <option value="WhatsApp">WhatsApp (Direct Inquiry)</option>
                    <option value="Website">Website (Inbound Form / SEO)</option>
                    <option value="Referral">Referral (Client / Partner)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="3500"
                    value={manualForm.estimatedValue}
                    onChange={(e) => setManualForm({ ...manualForm, estimatedValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Additional context on prospective client requirement..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadAnalyticsWidget
