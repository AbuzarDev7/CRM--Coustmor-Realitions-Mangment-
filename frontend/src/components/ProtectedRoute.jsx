import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * ProtectedRoute Component
 * 
 * Guards routes based on authentication and user roles.
 * Supports multiple roles simultaneously (e.g. allowing both 'manager' and 'admin' / 'superadmin').
 * 
 * @param {Array<string>} allowedRoles - List of permitted roles (e.g. ['manager', 'admin', 'superadmin'])
 * @param {React.ReactNode} children - Child component to render
 */
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation()
  const token = localStorage.getItem('crm_token')
  const storedUser = localStorage.getItem('crm_user')

  if (!token && !storedUser) {
    // Redirect unauthenticated visitors to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  let user = null
  try {
    user = storedUser ? JSON.parse(storedUser) : null
  } catch (e) {
    console.error('Failed to parse user session:', e)
  }

  const rawRole = (user?.role || '').toLowerCase().trim()
  // Map role aliases: superadmin <-> admin
  const normalizedRole = rawRole === 'superadmin' ? 'admin' : rawRole

  // Check if role is allowed
  const hasPermission =
    allowedRoles.length === 0 ||
    allowedRoles.some((r) => {
      const targetRole = r.toLowerCase().trim()
      if (targetRole === 'superadmin' && normalizedRole === 'admin') return true
      if (targetRole === 'admin' && (normalizedRole === 'admin' || rawRole === 'superadmin')) return true
      return targetRole === normalizedRole
    })

  if (!hasPermission) {
    // If not authorized for this route, redirect to their role's native dashboard
    if (normalizedRole === 'admin') {
      return <Navigate to="/dashboard" replace />
    } else if (normalizedRole === 'manager') {
      return <Navigate to="/manager-dashboard" replace />
    } else if (normalizedRole === 'agent' || normalizedRole === 'staff') {
      return <Navigate to="/agent-dashboard" replace />
    } else if (normalizedRole === 'customer' || normalizedRole === 'client') {
      return <Navigate to="/portal" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute
