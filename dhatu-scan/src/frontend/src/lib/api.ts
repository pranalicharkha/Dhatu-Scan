// Central API configuration for Dhatu-Scan
// All fetch calls to the backend should import from here.
const DEFAULT_API_PORT = "8000";

function getDefaultApiBase(): string {
  if (typeof window === "undefined") {
    return `http://127.0.0.1:${DEFAULT_API_PORT}`;
  }

  const { protocol, hostname } = window.location;
  const normalizedHost = hostname.trim().toLowerCase();

  if (!normalizedHost || normalizedHost === "localhost" || normalizedHost === "127.0.0.1") {
    return `http://127.0.0.1:${DEFAULT_API_PORT}`;
  }

  const apiProtocol = protocol === "https:" ? "https:" : "http:";
  return `${apiProtocol}//${hostname}:${DEFAULT_API_PORT}`;
}

function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_PY_BACKEND_URL ?? import.meta.env.PY_BACKEND_URL;
  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  return getDefaultApiBase();
}

export const API_BASE = resolveApiBase();

/**
 * Make an authenticated API request using the JWT token from Dexie local DB.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}
