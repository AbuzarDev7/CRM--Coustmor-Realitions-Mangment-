import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AgentDashboard from './pages/AgentDashboard'
import PublicCompanyForm from './pages/PublicCompanyForm'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Home Page with Property Inquiry Form */}
          <Route path="/" element={<Home />} />

          {/* Multi-Tenant Public Lead Routing (Public Form to Specific Company) */}
          <Route path="/form/:companySlug" element={<PublicCompanyForm />} />
          <Route path="/c/:companySlug" element={<PublicCompanyForm />} />
          <Route path="/inquiry/:companySlug" element={<PublicCompanyForm />} />

          {/* Staff Authentication (Superadmin, Manager, Agent) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Legacy Customer Portal routes redirect to Home */}
          <Route path="/portal" element={<Navigate to="/" replace />} />
          <Route path="/customer" element={<Navigate to="/" replace />} />
          <Route path="/client-dashboard" element={<Navigate to="/" replace />} />

          {/* 1. Super Admin & Company Admin CRM Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'company_admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'company_admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

          {/* 2. Manager CRM Dashboard */}
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager', 'superadmin', 'admin']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/manager" element={<Navigate to="/manager-dashboard" replace />} />
          <Route path="/dashboard/manager" element={<Navigate to="/manager-dashboard" replace />} />

          {/* 3. Agent CRM Dashboard */}
          <Route
            path="/agent-dashboard"
            element={
              <ProtectedRoute allowedRoles={['agent', 'manager', 'superadmin', 'admin']}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/agent" element={<Navigate to="/agent-dashboard" replace />} />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App