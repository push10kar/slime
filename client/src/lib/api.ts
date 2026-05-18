/**
 * API Configuration - Centralized API endpoint management
 * Supports both development and production environments
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: `${API_BASE_URL}/auth/token`,

  // Adapters
  ADAPTERS_LIST: `${API_BASE_URL}/adapters`,
  ADAPTERS_FETCH: (type: string, endpoint: string) =>
    `${API_BASE_URL}/adapters/${type}/fetch?endpoint=${endpoint}`,
  ADAPTERS_HISTORY: `${API_BASE_URL}/adapters/history`,
  ADAPTERS_CREATE: `${API_BASE_URL}/adapters`,

  // Transform
  TRANSFORM_NORMALIZE: `${API_BASE_URL}/transform/normalize`,
  TRANSFORM_UPLOAD: `${API_BASE_URL}/transform/upload-file`,

  // Metrics
  METRICS_SUMMARY: `${API_BASE_URL}/api/metrics/summary`,
  METRICS_RAW: `${API_BASE_URL}/metrics`,

  // Health
  HEALTH_CHECK: `${API_BASE_URL}/health`,
};

/**
 * Helper to get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

/**
 * Helper to set auth token in localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
};

/**
 * Helper to clear auth token from localStorage
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem("auth_token");
};

/**
 * Helper function to get auth headers
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Login helper - exchanges username/password for JWT token
 */
export const loginUser = async (
  username: string,
  password: string,
): Promise<string> => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }

  return data.access_token;
};

/**
 * Ensure token exists, login if needed
 */
export const ensureAuthToken = async (): Promise<string> => {
  let token = getAuthToken();

  if (!token) {
    token = await loginUser("admin", "admin");
  }

  return token;
};

export default API_ENDPOINTS;
