// Central client for the UniVise backend API.
// Keeps the base URL, auth header and JSON handling in one place.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function apiUrl(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

// Thin wrapper over fetch. Returns the raw Response so callers that need
// streaming or their own status handling stay in control.
export function apiFetch(path, { token, body, headers, ...options } = {}) {
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

  return fetch(apiUrl(path), {
    ...options,
    headers: finalHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

// Same as apiFetch but throws on a non-2xx response and parses the JSON body.
export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `${options.method || "GET"} ${path} failed (${res.status}): ${detail.slice(0, 200)}`
    );
  }

  return res.json();
}
