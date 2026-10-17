import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AUTH_API_URL } from '../config/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // Initialize state directly from localStorage for immediate render without flash
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('crm_token') || null
    } catch (e) {
      return null
    }
  })

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('crm_user')
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      console.warn('Failed to parse crm_user from localStorage:', e)
      return null
    }
  })

  const [loading, setLoading] = useState(true)

  // Verify and refresh session from backend if token exists
  const refreshUser = useCallback(async (activeToken = token) => {
    if (!activeToken) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${AUTH_API_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser((prev) => {
            const merged = {
              ...prev,
              ...data.user,
              avatar: data.user.avatar || prev?.avatar || ''
            }
            try {
              localStorage.setItem('crm_user', JSON.stringify(merged))
            } catch {
              // ignore storage write errors
            }
            return merged
          })
        }
      }
    } catch (err) {
      console.warn('Failed to refresh user profile from /api/auth/me:', err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Login helper
  const login = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    try {
      if (newToken) localStorage.setItem('crm_token', newToken)
      if (newUser) localStorage.setItem('crm_user', JSON.stringify(newUser))
    } catch (e) {
      console.error('Error saving user session to localStorage:', e)
    }
  }

  // Logout helper
  const logout = () => {
    setToken(null)
    setUser(null)
    try {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
    } catch {
      // ignore storage removal errors
    }
  }

  // Update User profile in context & localStorage
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields }
      try {
        localStorage.setItem('crm_user', JSON.stringify(updated))
      } catch {
        // ignore storage write errors
      }
      return updated
    })
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user || token),
    role: (user?.role || '').toLowerCase().trim(),
    login,
    logout,
    updateUser,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
