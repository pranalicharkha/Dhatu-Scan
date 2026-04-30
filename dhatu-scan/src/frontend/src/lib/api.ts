// Central API configuration for Dhatu-Scan
// All fetch calls to the backend should import from here.

function resolveApiBase(): string {
  // In production (Vercel), VITE_PY_BACKEND_URL must be set to the Render backend URL.
  // In local dev, falls back to localhost:8000.
  const envUrl = import.meta.env.VITE_PY_BACKEND_URL ?? import.meta.env.VITE_API_URL;
  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  // Local development fallback only — never used in production
  return "http://127.0.0.1:8000";
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
