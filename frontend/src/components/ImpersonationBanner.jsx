import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ShieldAlert, ArrowLeft, ShieldCheck, Lock, Unlock } from 'lucide-react'

/**
 * ImpersonationBanner Component
 * 
 * Persistent top banner displayed whenever a Super Admin is inspecting/viewing 
 * another manager's dashboard. Includes a permission guard toggle (View-Only vs. Admin Override)
 * and an Exit button to return to the Super Admin Dashboard.
 */
const ImpersonationBanner = ({
  managerName = 'Sales Manager',
  managerRole = 'Regional Sales Manager',
  managerDepartment = 'Sales Management',
  isReadOnly = false,
  onToggleReadOnly = () => {}
}) => {
  const navigate = useNavigate()

  const handleExit = () => {
    navigate('/dashboard')
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/30 text-white shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Inspection Notice */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Super Admin Inspection Mode
                </span>
                <span className="text-xs text-slate-300">
                  You are viewing the dashboard as Manager:
                </span>
                <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                  {managerName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                {managerRole} • {managerDepartment} • Showing live team metrics & queue
              </p>
            </div>
          </div>

          {/* Right: Permission Guard & Exit Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Permission Guard Toggle */}
            <button
              type="button"
              onClick={onToggleReadOnly}
              title={isReadOnly ? "Switch to Admin Override" : "Switch to View-Only"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isReadOnly
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
              }`}
            >
              {isReadOnly ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>View-Only Inspection</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Override Active</span>
                </>
              )}
            </button>

            {/* Exit to Admin Dashboard Button */}
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition hover:scale-[1.02] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Admin Dashboard</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  )
}

export default ImpersonationBanner
