import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('crm_user')
    const token = localStorage.getItem('crm_token')

    if (!token && !storedUser) {
      navigate('/login')
      return
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error(e)
      }
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
            CRM
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Customer Relations Portal</h1>
            <p className="text-xs text-slate-400">Management & Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user?.email || 'User'}</p>
            <span className="inline-block text-xs uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              {user?.role || 'Admin'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-slate-800 hover:bg-red-600/80 hover:text-white text-slate-300 rounded-xl border border-slate-700 hover:border-red-500 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        <div className="p-8 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome, {user?.email || 'Agent'}! 👋</h2>
              <p className="text-slate-400 text-sm mt-1">
                Your authentication is active. You can now build and manage your customer relationships, leads, and contacts.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Backend API Connected
              </span>
            </div>
          </div>
        </div>

        {/* CRM Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
            <p className="text-sm text-slate-400">Total Customers</p>
            <p className="text-3xl font-bold text-white mt-2">128</p>
            <p className="text-xs text-emerald-400 mt-2 font-medium">↑ +12% this month</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
            <p className="text-sm text-slate-400">Active Leads</p>
            <p className="text-3xl font-bold text-white mt-2">42</p>
            <p className="text-xs text-blue-400 mt-2 font-medium">5 ready to close</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
            <p className="text-sm text-slate-400">Deals in Pipeline</p>
            <p className="text-3xl font-bold text-white mt-2">$24,500</p>
            <p className="text-xs text-amber-400 mt-2 font-medium">Updated today</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
            <p className="text-sm text-slate-400">User Role</p>
            <p className="text-2xl font-bold text-white mt-2 uppercase">{user?.role || 'Agent'}</p>
            <p className="text-xs text-indigo-400 mt-2 font-medium">Verified Account</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

