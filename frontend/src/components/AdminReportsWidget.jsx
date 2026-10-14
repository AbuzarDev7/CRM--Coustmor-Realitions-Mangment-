import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Layers,
  MessageSquare,
  ShieldCheck,
  Building,
  Mail,
  ChevronDown
} from 'lucide-react'
import {
  AreaChart,
  Area,
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

// Baseline Financial Performance by Month
const defaultMonthlyReports = [
  { month: 'Jan 2026', revenue: 42000, target: 35000, deals: 32, avgDeal: 1312, winRate: 22.4 },
  { month: 'Feb 2026', revenue: 56000, target: 45000, deals: 44, avgDeal: 1272, winRate: 24.1 },
  { month: 'Mar 2026', revenue: 51000, target: 48000, deals: 39, avgDeal: 1307, winRate: 21.8 },
  { month: 'Apr 2026', revenue: 68000, target: 58000, deals: 52, avgDeal: 1307, winRate: 25.5 },
  { month: 'May 2026', revenue: 79000, target: 65000, deals: 61, avgDeal: 1295, winRate: 27.2 },
  { month: 'Jun 2026', revenue: 74000, target: 70000, deals: 58, avgDeal: 1275, winRate: 24.6 },
  { month: 'Jul 2026', revenue: 89000, target: 75000, deals: 71, avgDeal: 1253, winRate: 28.1 },
  { month: 'Aug 2026', revenue: 98000, target: 82000, deals: 77, avgDeal: 1272, winRate: 29.4 },
  { month: 'Sep 2026', revenue: 112000, target: 90000, deals: 84, avgDeal: 1333, winRate: 31.0 },
  { month: 'Oct 2026', revenue: 128450, target: 95000, deals: 96, avgDeal: 1338, winRate: 32.5 }
]

// Pipeline Distribution Stages
const pipelineStagesData = [
  { stage: 'Prospecting', count: 28, value: 34200, color: '#94a3b8' },
  { stage: 'Qualified', count: 22, value: 48500, color: '#38bdf8' },
  { stage: 'Proposal Sent', count: 18, value: 62000, color: '#6366f1' },
  { stage: 'Negotiation', count: 12, value: 71400, color: '#a855f7' },
  { stage: 'Closed Won', count: 34, value: 128450, color: '#10b981' }
]

const AdminReportsWidget = ({
  kpiStats,
  revenueData,
  leadSources,
  teamMembers = [],
  managers = [],
  showToast
}) => {
  const [activeReportTab, setActiveReportTab] = useState('overview')
  const [timePeriod, setTimePeriod] = useState('Oct 2026')
  const [searchFilter, setSearchFilter] = useState('')
  const [exportingCsv, setExportingCsv] = useState(false)
  const [liveDeals, setLiveDeals] = useState([])
  const [chatAuditReports, setChatAuditReports] = useState([])
  const [loadingDeals, setLoadingDeals] = useState(false)
  const [scheduleEmail, setScheduleEmail] = useState('admin@crm.com')
  const [scheduleFrequency, setScheduleFrequency] = useState('Weekly Monday 09:00 AM')

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

  // Calculate summary metrics
  const totalRevenueNumber = useMemo(() => {
    if (kpiStats?.totalRevenue?.raw) return kpiStats.totalRevenue.raw
    return 128450
  }, [kpiStats])

  const effectiveRevenueData = revenueData && revenueData.length > 0 ? revenueData : defaultMonthlyReports

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
        // Client-side fallback generator
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
    lines.push('=== SECTION 3: LEAD ATTRIBUTION ===')
    lines.push('Channel,Count,Share (%)')
    const totalLeadsCount = (leadSources || []).reduce((acc, curr) => acc + (curr.value || 0), 0) || 1
    ;(leadSources || []).forEach((s) => {
      const pct = (((s.value || 0) / totalLeadsCount) * 100).toFixed(1)
      lines.push(`"${s.name}",${s.value},${pct}%`)
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `onesoft_executive_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Executive Report CSV generated and downloaded!')
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
    <div className="space-y-8 animate-fade-in print:p-0">
      {/* =========================================================================
          1. HEADER & REPORT ACTIONS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-violet-700 tracking-wider uppercase bg-violet-100/70 border border-violet-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Executive Intelligence Hub
            </span>
            <span className="text-xs text-slate-400">• Official Audit Trail</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Enterprise Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cross-departmental performance reports, revenue projections, staff quotas, and pipeline audits.
          </p>
        </div>

        {/* Global Report Actions */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Period selector */}
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value)
                showToast(`Report interval switched to ${e.target.value}`)
              }}
              className="appearance-none bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 pr-8 rounded-full shadow-xs hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingDeals ? 'animate-spin text-violet-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadFullReport}
            disabled={exportingCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-md shadow-violet-600/20 hover:scale-[1.02] transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingCsv ? 'Generating CSV...' : 'Download Full CSV'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. EXECUTIVE SUMMARY STAT CARDS (5 METRIC CARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Gross Reported Revenue */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Gross Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            ${totalRevenueNumber.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              <ArrowUpRight className="w-3 h-3" /> +12.5%
            </span>
            <span className="text-slate-400">vs target</span>
          </div>
        </div>

        {/* KPI 2: Average Deal Size */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Avg Deal Size</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            $14,250
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="inline-flex items-center gap-0.5 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
              <TrendingUp className="w-3 h-3" /> +6.4%
            </span>
            <span className="text-slate-400">contract value</span>
          </div>
        </div>

        {/* KPI 3: Sales Win Rate */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Sales Win Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {kpiStats?.conversionRate?.formatted || '24.8%'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Industry Top 10%
            </span>
          </div>
        </div>

        {/* KPI 4: Sales Velocity Cycle */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Sales Velocity</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            14.2 Days
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-sky-700 font-bold">
            <span className="bg-sky-50 px-2 py-0.5 rounded-full">-2.1 Days faster</span>
          </div>
        </div>

        {/* KPI 5: Total Pipeline Leads */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tracked Leads</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {kpiStats?.totalLeads?.formatted || '1,420'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
              +8.2% growth
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. REPORT CATEGORY NAVIGATION SUB-TABS
          ========================================================================= */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1.5 text-xs font-bold print:hidden">
        {[
          { id: 'overview', label: 'Overview & Forecasts', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue Growth & Targets', icon: DollarSign },
          { id: 'team', label: 'Sales Staff & Quotas', icon: Users, badge: teamMembers.length },
          { id: 'pipeline', label: 'Deals Pipeline Stages', icon: Briefcase },
          { id: 'audits', label: 'Chat Quality Audits', icon: MessageSquare, badge: chatAuditReports.length || 4 }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeReportTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Trend vs Target Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Quarterly Revenue Attainment vs Forecast
                  </h3>
                  <p className="text-xs text-slate-500">Live comparison against assigned target quotas ($)</p>
                </div>
                <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                  Target Met: 135%
                </span>
              </div>

              <div className="h-72 w-full">
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
                    <Bar dataKey="target" name="Target Target" fill="#93c5fd" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-violet-600"></span>
                  <span>Actual Revenue Closed ($)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-sky-300"></span>
                  <span>Target Target ($)</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stage Distribution Pie */}
            <div className="lg:col-span-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Pipeline Stages</h3>
                  <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Active Deals
                  </span>
                </div>

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
                              <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-lg">
                                <p className="font-bold">{payload[0].name}</p>
                                <p className="text-emerald-300">${payload[0].value?.toLocaleString()}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-slate-900">
                      ${(pipelineStagesData.reduce((acc, c) => acc + c.value, 0) / 1000).toFixed(0)}k
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Pipe</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                {pipelineStagesData.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600 font-medium">{s.stage}</span>
                    </div>
                    <span className="font-bold text-slate-900">${s.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Automated Schedule Digest Card */}
          <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                onClick={() => showToast(`Automated report schedule configured for ${scheduleEmail} (${scheduleFrequency})`)}
                className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition cursor-pointer whitespace-nowrap"
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Monthly Financial & Quota Attainment Table
              </h3>
              <p className="text-xs text-slate-500">Historical performance breakdown with variance analysis</p>
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Table CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-bold border-b border-slate-100 pb-2">
                  <th className="pb-3 font-semibold pl-1">Month Period</th>
                  <th className="pb-3 font-semibold text-right">Revenue Closed</th>
                  <th className="pb-3 font-semibold text-right">Target Quota</th>
                  <th className="pb-3 font-semibold text-right">Variance ($)</th>
                  <th className="pb-3 font-semibold text-center">Deals Closed</th>
                  <th className="pb-3 font-semibold text-right pr-1">Target Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {effectiveRevenueData.map((row, idx) => {
                  const variance = (row.revenue || 0) - (row.target || 0)
                  const isPositive = variance >= 0
                  const pct = Math.round(((row.revenue || 0) / (row.target || 1)) * 100)
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pl-1 font-bold text-slate-900">{row.month}</td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900">
                        ${row.revenue?.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right text-slate-500">
                        ${row.target?.toLocaleString() || 'N/A'}
                      </td>
                      <td className={`py-3.5 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isPositive ? `+$${variance.toLocaleString()}` : `-$${Math.abs(variance).toLocaleString()}`}
                      </td>
                      <td className="py-3.5 text-center font-bold text-slate-700">
                        {row.deals || 35}
                      </td>
                      <td className="py-3.5 text-right pr-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Staff Productivity & Quota Attainment Audit
              </h3>
              <p className="text-xs text-slate-500">
                Individual deal performance, success velocity, and quota milestones for sales personnel
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter rep name or role..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-bold border-b border-slate-100 pb-2">
                  <th className="pb-3 font-semibold pl-1">Sales Professional</th>
                  <th className="pb-3 font-semibold">Designated Role</th>
                  <th className="pb-3 font-semibold text-center">Deals Closed</th>
                  <th className="pb-3 font-semibold text-right">Total Revenue Won</th>
                  <th className="pb-3 font-semibold text-center">Conversion Velocity</th>
                  <th className="pb-3 font-semibold text-right pr-1">Quota Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
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
                        <td className="py-3.5 pl-1">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                agent.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={agent.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">{agent.name}</p>
                              <p className="text-[11px] text-slate-400">{agent.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600 font-medium">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {agent.role || 'Sales Representative'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-800">
                          {agent.dealsClosed || 0}
                        </td>
                        <td className="py-3.5 text-right font-extrabold text-slate-900">
                          ${(agent.totalValue || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              (agent.successRate || 80) >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-violet-50 text-violet-700'
                            }`}
                          >
                            {agent.successRate || 80}% win rate
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-1">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full"
                                style={{ width: `${quotaPercent}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 text-[11px] w-9 text-right">
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Active Deals Pipeline & Stage Probability Audit
              </h3>
              <p className="text-xs text-slate-500">Live deal velocity and weighted forecast value</p>
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Deals CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {pipelineStagesData.map((stage, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">{stage.stage}</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                </div>
                <p className="text-lg font-black text-slate-900">
                  ${stage.value.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {stage.count} deals in pipeline
                </p>
              </div>
            ))}
          </div>

          {/* Deals table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-bold border-b border-slate-100 pb-2">
                  <th className="pb-3 font-semibold pl-1">Opportunity / Client</th>
                  <th className="pb-3 font-semibold text-right">Deal Value</th>
                  <th className="pb-3 font-semibold text-center">Pipeline Stage</th>
                  <th className="pb-3 font-semibold text-center">Win Probability</th>
                  <th className="pb-3 font-semibold text-right pr-1">Weighted Value</th>
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
                      <td className="py-3.5 pl-1 font-bold text-slate-900">
                        {deal.title}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900">
                        ${(deal.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-violet-50 text-violet-700 border border-violet-200">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-bold text-slate-700">
                        {deal.probability || 50}%
                      </td>
                      <td className="py-3.5 text-right pr-1 font-bold text-emerald-600">
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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Customer Support & Conversation Quality Audits
              </h3>
              <p className="text-xs text-slate-500">Audited chat sessions filed by regional managers and sales staff</p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Quality Assurance Compliance: 98.4%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-500">Total Audited Sessions</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{chatAuditReports.length || 24}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across all regional branches</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-xs font-bold text-emerald-700">First Contact Resolution</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">91.6%</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Resolved on primary session</p>
            </div>
            <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80">
              <span className="text-xs font-bold text-violet-700">Positive Sentiment Score</span>
              <p className="text-2xl font-black text-violet-900 mt-1">88.2%</p>
              <p className="text-[11px] text-violet-600 mt-0.5">CSAT benchmark satisfaction</p>
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
              <div key={idx} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.customerName || 'Customer Client'}</span>
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
                  <p className="text-[10px] text-slate-400">Audited by: {item.reportedBy || 'Manager'} • {item.date || 'Recent'}</p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
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
