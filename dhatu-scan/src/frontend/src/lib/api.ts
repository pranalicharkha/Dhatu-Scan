// Central API configuration for Dhatu-Scan
// All fetch calls to the backend should import from here.
const DEFAULT_API_BASE = "http://127.0.0.1:8000";

function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_PY_BACKEND_URL ?? import.meta.env.PY_BACKEND_URL;
  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  return DEFAULT_API_BASE;
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
