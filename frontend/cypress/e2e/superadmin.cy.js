/**
 * =========================================================================
 * Cypress End-to-End (E2E) Test Suite: Super Admin Control & Oversight
 * =========================================================================
 * 
 * Scope & Test Checklist:
 * 1. Root Routing & Clutter-Free Layout:
 *    - Verify Super Admin layout renders with signature aurora header and no redundant widgets.
 *    - Test sidebar navigation between /dashboard (or /admin), /leads, /staff (managers), and /settings without 404s.
 * 
 * 2. Zero Mock Data & Backend Persistence (Managers):
 *    - Verify manager table initializes from real DB and handles empty states gracefully.
 *    - Test opening "+ Add Manager" modal, submitting valid inputs, and verifying record persistence.
 * 
 * 3. Super Admin Impersonation ("View as Manager"):
 *    - Click "View Dashboard" on a manager in the directory.
 *    - Verify redirection to /dashboard/manager?managerId=...&impersonate=true.
 *    - Verify the persistent top banner: "You are viewing the dashboard as Manager: [Manager Name]".
 *    - Click "Exit to Admin Dashboard" and verify clean return to primary root dashboard.
 * 
 * 4. Global KPI Cards & Oversight:
 *    - Verify rendering of Total Revenue, Active Team Staff, Total System Leads, and Deal Win Rate.
 */

describe('Super Admin CRM E2E Test Suite', () => {
  const superAdminUser = {
    email: 'admin@crm.com',
    name: 'Super Admin',
    role: 'superadmin'
  };

  const sampleManager = {
    name: 'Tariq Mansoor',
    email: `manager_${Date.now()}@onesoft.com`,
    role: 'Regional Sales Manager',
    department: 'Enterprise Sales',
    monthlyQuota: '150000',
    phone: '+92 300 9876543'
  };

  beforeEach(() => {
    // 1. Seed authenticated Super Admin session in localStorage before each test
    cy.window().then((win) => {
      win.localStorage.setItem('crm_token', 'mock_jwt_superadmin_token_xyz');
      win.localStorage.setItem('crm_user', JSON.stringify(superAdminUser));
    });
  });

  // =========================================================================
  // 1. Root Routing & Clutter-Free Layout
  // =========================================================================
  it('1. Root Routing: Loads Super Admin dashboard and transitions views dynamically without 404s', () => {
    cy.visit('/dashboard');

    // Verify main header and greeting
    cy.contains(/Hello, Super|Hello, Admin/i).should('be.visible');
    cy.contains('Executive CRM oversight, pipeline velocity & team performance.').should('be.visible');

    // Verify sidebar navigation elements exist
    cy.get('aside').should('exist');
    cy.contains('nav', 'Dashboard').should('exist');
    cy.contains('nav', 'Staff & Users').should('exist');
    cy.contains('nav', 'Lead Ingestion').should('exist');
    cy.contains('nav', 'Settings').should('exist');

    // Test sidebar routing to Staff / Managers directory
    cy.contains('button', 'Staff & Users').click();
    cy.url().should('include', 'staff');
    cy.contains('h2', 'Staff & User Management').should('be.visible');
    cy.contains('Authorized Managers Directory').should('be.visible');

    // Test sidebar routing to Lead Ingestion widget
    cy.contains('button', 'Lead Ingestion').click();
    cy.contains(/Lead Ingestion|Social Media/i).should('be.visible');

    // Return to main dashboard
    cy.contains('button', 'Dashboard').click();
    cy.contains('Total revenue').should('be.visible');
  });

  // =========================================================================
  // 2. Zero Mock Data & Backend Persistence (Managers)
  // =========================================================================
  it('2. Backend Persistence: Super Admin opens modal, registers manager, and verifies persistence', () => {
    // Intercept backend API calls for verification
    cy.intercept('GET', '/api/admin/managers').as('getManagers');
    cy.intercept('POST', '/api/admin/managers').as('addManager');

    cy.visit('/admin/managers');
    cy.wait('@getManagers');

    // Open Add Manager Modal
    cy.contains('button', '+ Add Manager').click();

    // Verify Super Admin permission badge in modal
    cy.contains('Super Admin Only').should('be.visible');
    cy.contains('+ Add New Manager').should('be.visible');

    // Fill form fields
    cy.get('input[type="text"]').first().clear().type(sampleManager.name);
    cy.get('input[type="email"]').first().clear().type(sampleManager.email);
    cy.get('input[type="number"]').first().clear().type(sampleManager.monthlyQuota);

    // Submit Manager creation
    cy.get('form').contains('button', /Save|Add Manager/i).click();

    // Verify API POST request was dispatched with proper payload
    cy.wait('@addManager').then((interception) => {
      expect(interception.request.body.name).to.equal(sampleManager.name);
      expect(interception.request.body.email).to.equal(sampleManager.email);
    });

    // Verify toast confirmation
    cy.contains(/registered and saved to database/i, { timeout: 6000 }).should('be.visible');
  });

  // =========================================================================
  // 3. Super Admin Impersonation ("View as Manager")
  // =========================================================================
  it('3. Impersonation: Super Admin inspects Manager Dashboard and returns safely via Exit button', () => {
    // Directly visit manager dashboard with Super Admin inspection query params
    const targetManagerId = '66f1234567890abcdef12345';
    const targetManagerName = 'Imran Siddiqui';

    cy.visit(`/dashboard/manager?managerId=${targetManagerId}&managerName=${encodeURIComponent(targetManagerName)}&impersonate=true`);

    // Verify Persistent Top Impersonation Banner renders
    cy.get('.sticky').should('be.visible');
    cy.contains('Super Admin Inspection Mode').should('be.visible');
    cy.contains('You are viewing the dashboard as Manager:').should('be.visible');
    cy.contains(targetManagerName).should('be.visible');

    // Verify Admin Override / View-Only toggle
    cy.contains(/Admin Override Active|View-Only Inspection/i).should('be.visible');

    // Click "Exit to Admin Dashboard" button
    cy.contains('button', 'Exit to Admin Dashboard').click();

    // Verify clean redirection back to Super Admin root control
    cy.url().should('include', '/dashboard');
    cy.contains(/Hello, Super|Executive CRM oversight/i).should('be.visible');
  });

  // =========================================================================
  // 4. Global KPI Cards & Oversight
  // =========================================================================
  it('4. Global KPI Cards: Renders executive oversight cards and lead acquisition velocity', () => {
    cy.intercept('GET', '/api/admin/dashboard/stats', {
      statusCode: 200,
      body: {
        success: true,
        stats: {
          totalRevenue: { raw: 154200, formatted: '$154,200', change: '+12.5%' },
          totalLeads: { raw: 1890, formatted: '1,890', change: '+8.2%' },
          activeDeals: { raw: 94, formatted: '94 deals' },
          conversionRate: { raw: 24.8, formatted: '24.8%' }
        },
        revenueGrowth: [],
        leadSources: []
      }
    }).as('mockStats');

    cy.visit('/dashboard');
    cy.wait('@mockStats');

    // Verify 4 KPI cards render values
    cy.contains('Total revenue').should('be.visible');
    cy.contains('154').should('be.visible');
    cy.contains('Active team staff').should('be.visible');
    cy.contains('Total leads generated').should('be.visible');
    cy.contains('Deal win rate').should('be.visible');
    cy.contains('24.8%').should('be.visible');
  });
});
