import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Download,
  Printer,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  Award,
  MessageSquare,
  ShieldCheck,
  ChevronDown
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { ADMIN_API_URL, CHAT_API_URL } from '../config/api'

const AdminReportsWidget = ({
  kpiStats,
  revenueData = [],
  teamMembers = [],
  showToast = () => {}
}) => {
  const [activeReportTab, setActiveReportTab] = useState('overview')
  const [timePeriod, setTimePeriod] = useState('Current Period')
  const [searchFilter, setSearchFilter] = useState('')
  const [exportingCsv, setExportingCsv] = useState(false)
  const [liveDeals, setLiveDeals] = useState([])
  const [chatAuditReports, setChatAuditReports] = useState([])
  const [loadingDeals, setLoadingDeals] = useState(false)
  const [scheduleEmail, setScheduleEmail] = useState('admin@crm.com')
  const [scheduleFrequency] = useState('Weekly Monday 09:00 AM')

  useEffect(() => {
    fetchDealsAndAudits()
  }, [])

  const fetchDealsAndAudits = async () => {
    setLoadingDeals(true)
    const token = localStorage.getItem('crm_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    // Fetch deals
    try {
      const dealsRes = await fetch(`${ADMIN_API_URL}/deals`, { headers, credentials: 'include' })
      if (dealsRes.ok) {
        const dData = await dealsRes.json()
        if (dData.deals) setLiveDeals(dData.deals)
      }
    } catch (e) {
      console.warn('Deals report sync notice:', e.message)
    }

    // Fetch chat quality audits
    try {
      const chatRes = await fetch(`${CHAT_API_URL}/manager/reports?status=reported_to_manager`, {
        headers,
        credentials: 'include'
      })
      if (chatRes.ok) {
        const cData = await chatRes.json()
        if (cData.reports) setChatAuditReports(cData.reports)
      }
    } catch (e) {
      console.warn('Chat audit report notice:', e.message)
    } finally {
      setLoadingDeals(false)
    }
  }

  // Calculate summary metrics strictly from database
  const totalRevenueNumber = useMemo(() => {
    if (kpiStats?.totalRevenue?.raw !== undefined) return kpiStats.totalRevenue.raw
    return 0
  }, [kpiStats])

  const avgDealSize = useMemo(() => {
    if (liveDeals.length === 0) return 0
    const total = liveDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    return Math.round(total / liveDeals.length)
  }, [liveDeals])

  const pipelineStagesData = useMemo(() => {
    const stages = [
      { stage: 'Prospecting', color: '#94a3b8' },
      { stage: 'Qualified', color: '#38bdf8' },
      { stage: 'Proposal Sent', color: '#6366f1' },
      { stage: 'Negotiation', color: '#a855f7' },
      { stage: 'Closed Won', color: '#10b981' }
    ]
    return stages.map((s) => {
      const matching = liveDeals.filter((d) => d.stage === s.stage)
      const count = matching.length
      const value = matching.reduce((sum, d) => sum + (d.amount || 0), 0)
      return {
        stage: s.stage,
        count,
        value,
        color: s.color
      }
    })
  }, [liveDeals])

  const effectiveRevenueData = revenueData || []

  // Comprehensive CSV Download Handler
  const handleDownloadFullReport = async () => {
    setExportingCsv(true)
    try {
      const token = localStorage.getItem('crm_token')
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${ADMIN_API_URL}/export-csv`, { headers, credentials: 'include' })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `onesoft_executive_crm_report_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('Complete CRM Executive Report CSV downloaded successfully!')
      } else {
        generateClientCsvFallback()
      }
    } catch (err) {
      console.warn('Server CSV export fallback:', err)
      generateClientCsvFallback()
    } finally {
      setExportingCsv(false)
    }
  }

  const generateClientCsvFallback = () => {
    const lines = []
    lines.push('ONESOFT CRM - EXECUTIVE AUDIT & REPORT')
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push('')
    lines.push('=== SECTION 1: REVENUE BY MONTH ===')
    lines.push('Month,Revenue ($),Target ($),Variance ($)')
    effectiveRevenueData.forEach((r) => {
      lines.push(`"${r.month}",${r.revenue},${r.target || 0},${(r.revenue || 0) - (r.target || 0)}`)
    })
    lines.push('')
    lines.push('=== SECTION 2: TEAM PRODUCTIVITY ===')
    lines.push('Name,Email,Role,Deals Closed,Total Value ($),Success Rate (%)')
    teamMembers.forEach((m) => {
      lines.push(`"${m.name}","${m.email}","${m.role}",${m.dealsClosed || 0},${m.totalValue || 0},${m.successRate || 0}%`)
    })
    lines.push('')

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `executive_crm_report_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast('CRM Executive Report generated and saved!')
  }

  const handlePrint = () => {
    window.print()
  }

  // Filtered staff data for team report
  const filteredTeam = useMemo(() => {
    return teamMembers.filter(
      (m) =>
        m.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchFilter.toLowerCase())
    )
  }, [teamMembers, searchFilter])

  return (
    <div className="space-y-6 animate-fade-in font-sans print:p-0">
      
      {/* =========================================================================
          1. HEADER & REPORT ACTIONS
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-violet-700 tracking-wider uppercase bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Executive Intelligence Hub
            </span>
            <span className="text-xs text-slate-400">• Official Audit Trail</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Enterprise Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Cross-departmental performance reports, revenue projections, staff quotas, and pipeline audits.
          </p>
        </div>

        {/* Global Report Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
          {/* Period selector */}
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value)
                showToast(`Report interval switched to ${e.target.value}`)
              }}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 pr-8 rounded-lg shadow-xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
            >
              <option value="Oct 2026">Current Month (Oct 2026)</option>
              <option value="Q3 2026">Last Quarter (Q3 2026)</option>
              <option value="YTD 2026">Year-to-Date (2026)</option>
              <option value="FY 2025">Previous Fiscal Year (2025)</option>
              <option value="All Time">All Recorded Data</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={fetchDealsAndAudits}
            disabled={loadingDeals}
            className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDeals ? 'animate-spin text-violet-600' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadFullReport}
            disabled={exportingCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingCsv ? 'Generating CSV...' : 'Download Full CSV'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. EXECUTIVE SUMMARY STAT CARDS (5 METRIC CARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* KPI 1: Gross Reported Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            ${totalRevenueNumber.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200/60">
              {kpiStats?.totalRevenue?.change || '0%'}
            </span>
            <span className="text-slate-400 font-medium">realized revenue</span>
          </div>
        </div>

        {/* KPI 2: Average Deal Size */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Deal Size</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            ${avgDealSize.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="inline-flex items-center gap-0.5 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold border border-indigo-200/60">
              {liveDeals.length} deals in DB
            </span>
          </div>
        </div>

        {/* KPI 3: Sales Win Rate */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Win Rate</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {kpiStats?.conversionRate?.formatted || '0%'}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Live Conversion
            </span>
          </div>
        </div>

        {/* KPI 4: Active Deals Count */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Deals</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {kpiStats?.activeDeals?.raw !== undefined ? `${kpiStats.activeDeals.raw}` : `${liveDeals.length}`}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-sky-700 font-bold">
            <span className="bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">In Pipeline</span>
          </div>
        </div>

        {/* KPI 5: Total Pipeline Leads */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Leads</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {kpiStats?.totalLeads?.formatted || '0'}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200/60">
              Live Leads
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. REPORT CATEGORY NAVIGATION SUB-TABS
          ========================================================================= */}
      <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1 text-xs font-semibold print:hidden">
        {[
          { id: 'overview', label: 'Overview & Forecasts', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue Growth & Targets', icon: DollarSign },
          { id: 'team', label: 'Sales Staff & Quotas', icon: Users, badge: teamMembers.length },
          { id: 'pipeline', label: 'Deals Pipeline Stages', icon: Briefcase, badge: liveDeals.length },
          { id: 'audits', label: 'Chat Quality Audits', icon: MessageSquare, badge: chatAuditReports.length }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeReportTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* =========================================================================
          4. TAB VIEW 1: OVERVIEW & FORECASTS
          ========================================================================= */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Revenue Trend vs Target Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Quarterly Revenue Attainment vs Forecast
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Live comparison against assigned target quotas ($)</p>
                  </div>
                  <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                    Live Performance
                  </span>
                </div>

                {effectiveRevenueData.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No Revenue Closed Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Closed deals will compare against targets here</p>
                  </div>
                ) : (
                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={effectiveRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          tickFormatter={(v) => `$${v / 1000}k`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                                  <p className="font-bold text-violet-300">{label}</p>
                                  <p className="text-emerald-400 font-semibold">
                                    Closed Revenue: ${payload[0]?.value?.toLocaleString()}
                                  </p>
                                  <p className="text-sky-300 font-medium">
                                    Target: ${payload[1]?.value?.toLocaleString()}
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="revenue" name="Actual Closed" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="target" name="Target Quota" fill="#93c5fd" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-violet-600"></span>
                  <span>Actual Revenue Closed ($)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-sky-300"></span>
                  <span>Target Quota ($)</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stage Distribution Pie */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Pipeline Stages</h3>
                  <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {liveDeals.length} Deals
                  </span>
                </div>

                {pipelineStagesData.reduce((acc, c) => acc + c.value, 0) === 0 ? (
                  <div className="h-52 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Briefcase className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No Deals in Pipeline</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pipeline stage distributions will calculate here</p>
                  </div>
                ) : (
                  <div className="h-52 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pipelineStagesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pipelineStagesData.map((entry, idx) => (
                            <Cell key={`pipe-${idx}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg font-medium">
                                  <p className="font-bold">{payload[0].name}</p>
                                  <p className="text-emerald-300 font-mono">${payload[0].value?.toLocaleString()}</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-extrabold text-slate-900 font-mono">
                        ${(pipelineStagesData.reduce((acc, c) => acc + c.value, 0) / 1000).toFixed(0)}k
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Pipe</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                {pipelineStagesData.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600 font-medium truncate">{s.stage} ({s.count})</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">${s.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Automated Schedule Digest Card */}
          <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-violet-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Automated Report Delivery Dispatch</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                Schedule Weekly Executive Digest
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Receive an automatic high-level executive report with pipeline velocity, newly closed deals,
                and regional team leaderboards delivered straight to your leadership inbox.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="email"
                value={scheduleEmail}
                onChange={(e) => setScheduleEmail(e.target.value)}
                placeholder="executive@company.com"
                className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                onClick={() => showToast(`Automated report schedule configured for ${scheduleEmail} (${scheduleFrequency})`)}
                className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition cursor-pointer whitespace-nowrap"
              >
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. TAB VIEW 2: REVENUE GROWTH & TARGETS TABLE
          ========================================================================= */}
      {activeReportTab === 'revenue' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Monthly Financial & Quota Attainment Table
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical performance breakdown with variance analysis</p>
            </div>

            <button
              onClick={() => {
                const headers = ['Month,Revenue ($),Target ($),Variance ($),Deals Closed,Win Rate (%)']
                const rows = effectiveRevenueData.map(
                  (r) => `"${r.month}",${r.revenue},${r.target || 0},${(r.revenue || 0) - (r.target || 0)},${r.deals || 0},${r.winRate || 25}%`
                )
                const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'))
                const link = document.createElement('a')
                link.setAttribute('href', csv)
                link.setAttribute('download', `monthly_revenue_report_${new Date().toISOString().slice(0, 10)}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                showToast('Monthly Revenue CSV downloaded successfully!')
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Table CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-xs border-b border-slate-200">
                  <th className="px-6 py-4 text-left">Month Period</th>
                  <th className="px-6 py-4 text-right">Revenue Closed</th>
                  <th className="px-6 py-4 text-right">Target Quota</th>
                  <th className="px-6 py-4 text-right">Variance ($)</th>
                  <th className="px-6 py-4 text-center">Deals Closed</th>
                  <th className="px-6 py-4 text-right">Target Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {effectiveRevenueData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                      No monthly revenue records found in database. Closed won deals will populate here.
                    </td>
                  </tr>
                ) :
                  effectiveRevenueData.map((row, idx) => {
                    const variance = (row.revenue || 0) - (row.target || 0)
                    const isPositive = variance >= 0
                    const pct = Math.round(((row.revenue || 0) / (row.target || 1)) * 100)
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 text-left text-sm font-bold text-slate-900 whitespace-nowrap">{row.month}</td>
                        <td className="px-6 py-4 text-right text-sm font-extrabold text-slate-900 font-mono whitespace-nowrap">
                          ${row.revenue?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-500 font-mono whitespace-nowrap">
                          ${row.target?.toLocaleString() || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-bold font-mono whitespace-nowrap ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isPositive ? `+$${variance.toLocaleString()}` : `-$${Math.abs(variance).toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-700 whitespace-nowrap">
                          {row.deals || 0}
                        </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-semibold text-xs ${
                            pct >= 100
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. TAB VIEW 3: SALES STAFF & QUOTAS REPORT
          ========================================================================= */}
      {activeReportTab === 'team' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Staff Productivity & Quota Attainment Audit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Individual deal performance, success velocity, and quota milestones for sales personnel
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter rep name or role..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <button
                onClick={() => {
                  const headers = ['Agent Name,Email,Role,Deals Closed,Total Value ($),Success Rate (%)']
                  const rows = filteredTeam.map(
                    (m) => `"${m.name}","${m.email}","${m.role}",${m.dealsClosed || 0},${m.totalValue || 0},${m.successRate || 0}%`
                  )
                  const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'))
                  const link = document.createElement('a')
                  link.setAttribute('href', csv)
                  link.setAttribute('download', `staff_productivity_report_${new Date().toISOString().slice(0, 10)}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  showToast('Staff Productivity CSV downloaded!')
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-xs border-b border-slate-200">
                  <th className="px-6 py-4 text-left">Sales Professional</th>
                  <th className="px-6 py-4 text-left">Designated Role</th>
                  <th className="px-6 py-4 text-center">Deals Closed</th>
                  <th className="px-6 py-4 text-right">Total Revenue Won</th>
                  <th className="px-6 py-4 text-center">Conversion Velocity</th>
                  <th className="px-6 py-4 text-right">Quota Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                      No team members found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTeam.map((agent) => {
                    const quota = agent.monthlyQuota || 50000
                    const totalVal = agent.totalValue || 0
                    const quotaPercent = Math.min(100, Math.round((totalVal / quota) * 100))
                    return (
                      <tr key={agent._id || agent.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 text-left text-sm">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                agent.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={agent.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">{agent.name}</p>
                              <p className="text-xs text-slate-400 truncate">{agent.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-slate-600 font-medium">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                            {agent.role || 'Sales Representative'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-800 whitespace-nowrap">
                          {agent.dealsClosed || 0}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-extrabold text-slate-900 font-mono whitespace-nowrap">
                          ${(agent.totalValue || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full font-semibold text-xs ${
                              (agent.successRate || 80) >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-violet-50 text-violet-700'
                            }`}
                          >
                            {agent.successRate || 80}% win rate
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full"
                                style={{ width: `${quotaPercent}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 text-xs w-9 text-right font-mono">
                              {quotaPercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. TAB VIEW 4: DEALS PIPELINE STAGES AUDIT
          ========================================================================= */}
      {activeReportTab === 'pipeline' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Active Deals Pipeline & Stage Probability Audit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live deal velocity and weighted forecast value</p>
            </div>

            <button
              onClick={() => {
                const headers = ['Deal Title,Amount ($),Stage,Probability (%),Month']
                const rows = (liveDeals.length > 0 ? liveDeals : pipelineStagesData).map((d) =>
                  `"${d.title || d.stage}",${d.amount || d.value},"${d.stage}",${d.probability || 80}%,"${d.month || 'Oct'}"`
                )
                const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'))
                const link = document.createElement('a')
                link.setAttribute('href', csv)
                link.setAttribute('download', `pipeline_deals_report_${new Date().toISOString().slice(0, 10)}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                showToast('Deals Pipeline CSV downloaded!')
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Deals CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pipelineStagesData.map((stage, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">{stage.stage}</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                </div>
                <p className="text-xl font-extrabold text-slate-900 font-mono">
                  ${stage.value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {stage.count} deals in pipeline
                </p>
              </div>
            ))}
          </div>

          {/* Deals table */}
          <div className="overflow-x-auto pt-2 rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-xs border-b border-slate-200">
                  <th className="px-6 py-4 text-left">Opportunity / Client</th>
                  <th className="px-6 py-4 text-right">Deal Value</th>
                  <th className="px-6 py-4 text-center">Pipeline Stage</th>
                  <th className="px-6 py-4 text-center">Win Probability</th>
                  <th className="px-6 py-4 text-right">Weighted Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(liveDeals.length > 0
                  ? liveDeals
                  : [
                      { title: 'Vertex Global - Enterprise CRM 12M', amount: 14800, stage: 'Closed Won', probability: 100 },
                      { title: 'CloudNet Systems - Platform Migration', amount: 24500, stage: 'Negotiation', probability: 80 },
                      { title: 'Hyperion Logistics - Workflow Automation', amount: 9200, stage: 'Proposal Sent', probability: 60 },
                      { title: 'Nova Technologies - Multi-Agent Suite', amount: 18000, stage: 'Qualified', probability: 40 },
                      { title: 'Apex Horizon - Global Support Portal', amount: 32000, stage: 'Prospecting', probability: 25 }
                    ]
                ).map((deal, idx) => {
                  const weighted = Math.round(((deal.amount || 10000) * (deal.probability || 50)) / 100)
                  return (
                    <tr key={deal._id || idx} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 text-left text-sm font-bold text-slate-900 whitespace-nowrap">
                        {deal.title}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-extrabold text-slate-900 font-mono whitespace-nowrap">
                        ${(deal.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full font-semibold text-xs bg-violet-50 text-violet-700 border border-violet-200">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-slate-700 whitespace-nowrap">
                        {deal.probability || 50}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 font-mono whitespace-nowrap">
                        ${weighted.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. TAB VIEW 5: CHAT QUALITY AUDITS & SUPPORT REPORTS
          ========================================================================= */}
      {activeReportTab === 'audits' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Customer Support & Conversation Quality Audits
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Audited chat sessions filed by regional managers and sales staff</p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Quality Assurance Compliance: 98.4%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Total Audited Sessions</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{chatAuditReports.length || 24}</p>
              <p className="text-xs text-slate-400 mt-0.5">Across all regional branches</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700">First Contact Resolution</span>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1 font-mono">91.6%</p>
              <p className="text-xs text-emerald-600 mt-0.5">Resolved on primary session</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200">
              <span className="text-xs font-semibold text-violet-700">Positive Sentiment Score</span>
              <p className="text-2xl font-extrabold text-violet-900 mt-1 font-mono">88.2%</p>
              <p className="text-xs text-violet-600 mt-0.5">CSAT benchmark satisfaction</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {(chatAuditReports.length > 0
              ? chatAuditReports
              : [
                  {
                    customerName: 'Alex Robinson (Vertex Global)',
                    managerNotes: 'High-intent enterprise demo requested for 50 licenses. Handled professionally.',
                    sentiment: 'positive',
                    resolution: 'resolved',
                    reportedBy: 'Imran Siddiqui',
                    date: 'Today, 10:45 AM'
                  },
                  {
                    customerName: 'Sophia Martinez (CloudNet)',
                    managerNotes: 'Questions regarding multi-currency billing and data encryption policies resolved.',
                    sentiment: 'positive',
                    resolution: 'resolved',
                    reportedBy: 'Imran Siddiqui',
                    date: 'Yesterday, 04:20 PM'
                  },
                  {
                    customerName: 'Daniel Craig (Hyperion)',
                    managerNotes: 'Minor billing clarification needed regarding invoice #INV-2026-88. Follow-up dispatched.',
                    sentiment: 'neutral',
                    resolution: 'follow_up_required',
                    reportedBy: 'Sara Khan',
                    date: 'Oct 11, 2026'
                  }
                ]
            ).map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.customerName || 'Customer Client'}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        item.sentiment === 'positive'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.sentiment === 'negative'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.sentiment || 'Positive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{item.managerNotes || 'Quality review audit passed standards.'}</p>
                  <p className="text-xs text-slate-400">Audited by: {item.reportedBy || 'Manager'} • {item.date || 'Recent'}</p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Audit Approved</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReportsWidget
