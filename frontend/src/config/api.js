const getBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // When running in the browser, using relative URLs leverages Vite dev proxy (or reverse proxy in prod)
  // This completely eliminates CORS preflight issues, port mismatches, firewall blocks, and 'Failed to fetch' errors
  if (typeof window !== "undefined") {
    return "";
  }
  return "http://localhost:3000";
};

export const BACKEND_URL = getBaseUrl();

export const AUTH_API_URL = `${BACKEND_URL}/api/auth`;
export const ADMIN_API_URL = `${BACKEND_URL}/api/admin`;
export const MANAGER_API_URL = `${BACKEND_URL}/api/manager`;
export const AGENT_API_URL = `${BACKEND_URL}/api/agent`;
export const LEADS_API_URL = `${BACKEND_URL}/api/leads`;
export const WEBHOOK_API_URL = `${BACKEND_URL}/api/webhooks`;
export const COMPANIES_API_URL = `${BACKEND_URL}/api/companies`;

export const USERS_API_URL = `${BACKEND_URL}/api/users`;
export const CHAT_API_URL = `${BACKEND_URL}/api/chat`;
export const CUSTOMER_API_URL = `${BACKEND_URL}/api/customer`;
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost:3000");

// Base API URL for backward compatibility
export const API_BASE_URL = `${BACKEND_URL}/api/auth`;


