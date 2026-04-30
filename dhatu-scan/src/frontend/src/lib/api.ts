// Central API configuration for Dhatu-Scan
// All fetch calls to the backend should import from here.

// Production Render backend URL
const PRODUCTION_BACKEND_URL = "https://dhatu-scan-backend.onrender.com";

function resolveApiBase(): string {
  // Check Vercel environment variable first
  const envUrl = import.meta.env.VITE_PY_BACKEND_URL ?? import.meta.env.VITE_API_URL;
  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  // If running on localhost → use local dev backend
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    // Any other host (Vercel, custom domain) → use production Render backend
    return PRODUCTION_BACKEND_URL;
  }
  return PRODUCTION_BACKEND_URL;
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
