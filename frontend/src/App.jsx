import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/register'
import Dashboard from './pages/Dashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AgentDashboard from './pages/AgentDashboard'
import CustomerPortal from './pages/CustomerPortal'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        {/* Landing Home page */}
        <Route path="/" element={<Home />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* External Customer / Client Self-Service Portal */}
        <Route path="/portal" element={<CustomerPortal />} />
        <Route path="/client-dashboard" element={<Navigate to="/portal" replace />} />
        <Route path="/customer" element={<Navigate to="/portal" replace />} />

        {/* Super Admin Primary CRM Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Real-Time Lead Ingestion & Social Media Analytics */}
        <Route
          path="/leads"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin', 'manager']}>
              <Dashboard defaultNav="leads" />
            </ProtectedRoute>
          }
        />

        {/* Executive Reports & Intelligence Hub */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Dashboard defaultNav="reports" />
            </ProtectedRoute>
          }
        />

        {/* Platform & Admin Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Dashboard defaultNav="settings" />
            </ProtectedRoute>
          }
        />

        {/* Staff & User Management */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Dashboard defaultNav="staff" />
            </ProtectedRoute>
          }
        />

        {/* Deals Pipeline */}
        <Route
          path="/deals"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Dashboard defaultNav="dashboard" />
            </ProtectedRoute>
          }
        />

        {/* Manager CRM Dashboard & Inspection View: Allows both 'manager' and 'admin' / 'superadmin' */}
        <Route
          path="/dashboard/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin', 'superadmin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin', 'superadmin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/manager" element={<Navigate to="/dashboard/manager" replace />} />

        {/* Sales Agent CRM Dashboard */}
        <Route
          path="/agent-dashboard"
          element={
            <ProtectedRoute allowedRoles={['agent', 'staff', 'admin', 'superadmin']}>
              <AgentDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/agent" element={<Navigate to="/agent-dashboard" replace />} />

        {/* Catch-all route redirects to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)
}

export default App