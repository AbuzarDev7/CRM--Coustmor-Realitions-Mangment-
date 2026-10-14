export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL !== undefined 
  ? import.meta.env.VITE_BACKEND_URL 
  : "http://localhost:3000";

export const AUTH_API_URL = `${BACKEND_URL}/api/auth`;
export const ADMIN_API_URL = `${BACKEND_URL}/api/admin`;
export const MANAGER_API_URL = `${BACKEND_URL}/api/manager`;
export const AGENT_API_URL = `${BACKEND_URL}/api/agent`;
export const LEADS_API_URL = `${BACKEND_URL}/api/leads`;
export const WEBHOOK_API_URL = `${BACKEND_URL}/api/webhooks`;

export const USERS_API_URL = `${BACKEND_URL}/api/users`;
export const CHAT_API_URL = `${BACKEND_URL}/api/chat`;
export const CUSTOMER_API_URL = `${BACKEND_URL}/api/customer`;
export const SOCKET_URL = BACKEND_URL;

// Base API URL for backward compatibility
export const API_BASE_URL = `${BACKEND_URL}/api/auth`;


