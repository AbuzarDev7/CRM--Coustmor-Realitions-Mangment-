import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/register'
import Dashboard from './pages/Dashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AgentDashboard from './pages/AgentDashboard'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Home page */}
        <Route path="/" element={<Home />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Super Admin CRM Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Manager CRM Dashboard */}
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/manager" element={<Navigate to="/manager-dashboard" replace />} />

        {/* Sales Agent CRM Dashboard */}
        <Route path="/agent-dashboard" element={<AgentDashboard />} />
        <Route path="/agent" element={<Navigate to="/agent-dashboard" replace />} />

        {/* Catch-all route redirects to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App