// Central API configuration for Dhatu-Scan
// All fetch calls to the backend should import from here.

const envApiBase =
  import.meta.env.VITE_PY_BACKEND_URL ?? import.meta.env.PY_BACKEND_URL ?? "";

export const API_BASE =
  typeof envApiBase === "string" && envApiBase.trim().length > 0
    ? envApiBase.replace(/\/$/, "")
    : "http://127.0.0.1:8000";

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
