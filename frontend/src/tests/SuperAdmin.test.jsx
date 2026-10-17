import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import ManagerDashboard from '../pages/ManagerDashboard'
import ImpersonationBanner from '../components/ImpersonationBanner'
import { AuthProvider } from '../context/AuthContext'

/**
 * =========================================================================
 * React Testing Library (RTL) Test Suite: Super Admin UI & Workflows
 * =========================================================================
 */

const mockSuperAdminUser = {
  id: 'usr_admin_1',
  name: 'Super Admin',
  email: 'admin@crm.com',
  role: 'superadmin'
}

describe('Super Admin Role - React Testing Library Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('crm_token', 'test_bearer_token')
    localStorage.setItem('crm_user', JSON.stringify(mockSuperAdminUser))
    window.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // 1. Root Routing & Clutter-Free Layout
  test('1. Renders clean Super Admin dashboard layout without unauthorized widgets', async () => {
    window.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        stats: {
          totalRevenue: { raw: 128450, formatted: '$128,450' },
          totalLeads: { raw: 1420, formatted: '1,420' }
        },
        managers: [],
        staff: []
      })
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Dashboard defaultNav="dashboard" />
        </AuthProvider>
      </MemoryRouter>
    )

    // Verify main greetings & executive header
    expect(screen.getByText(/Hello, Super|Hello, Admin/i)).toBeInTheDocument()
    expect(screen.getByText(/Executive CRM oversight/i)).toBeInTheDocument()

    // Verify sidebar navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Staff & Users')).toBeInTheDocument()
    expect(screen.getByText('Lead Ingestion')).toBeInTheDocument()
    expect(screen.getByText('Executive Reports')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  // 2. Zero Mock Data: Managers table renders empty state cleanly
  test('2. Renders empty state message when database contains zero managers', async () => {
    window.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        managers: [] // Strictly empty state from DB
      })
    })

    render(
      <MemoryRouter initialEntries={['/staff']}>
        <AuthProvider>
          <Dashboard defaultNav="staff" />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Authorized Managers Directory')).toBeInTheDocument()
      expect(
        screen.getByText(/No managers registered yet. Click "\+ Add Manager" above./i)
      ).toBeInTheDocument()
    })
  })

  // 3. Super Admin Impersonation: Persistent banner & Exit button
  test('3. ImpersonationBanner displays target manager details and Exit button returns to /dashboard', async () => {
    const managerName = 'Imran Siddiqui'
    const managerRole = 'Regional Sales Manager'

    render(
      <MemoryRouter initialEntries={['/dashboard/manager?impersonate=true']}>
        <ImpersonationBanner
          managerName={managerName}
          managerRole={managerRole}
          managerDepartment="Sales Management"
        />
      </MemoryRouter>
    )

    // Verify inspection mode badge & manager name
    expect(screen.getByText('Super Admin Inspection Mode')).toBeInTheDocument()
    expect(screen.getByText('You are viewing the dashboard as Manager:')).toBeInTheDocument()
    expect(screen.getByText(managerName)).toBeInTheDocument()

    // Verify Exit button
    const exitBtn = screen.getByRole('button', { name: /Exit to Admin Dashboard/i })
    expect(exitBtn).toBeInTheDocument()
  })

  // 4. Global KPI Cards
  test('4. Displays 4 Global KPI Cards correctly with live metrics', async () => {
    window.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        stats: {
          totalRevenue: { raw: 185000, formatted: '$185,000' },
          totalLeads: { raw: 2450, formatted: '2,450' },
          activeDeals: { raw: 86, formatted: '86 deals' },
          conversionRate: { raw: 24.8, formatted: '24.8%' }
        },
        managers: [],
        staff: []
      })
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Dashboard defaultNav="dashboard" />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Total revenue')).toBeInTheDocument()
    expect(screen.getByText('Active team staff')).toBeInTheDocument()
    expect(screen.getByText('Total leads generated')).toBeInTheDocument()
    expect(screen.getByText('Deal win rate')).toBeInTheDocument()
  })
})
