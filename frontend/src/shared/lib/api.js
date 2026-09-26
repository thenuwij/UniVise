// Central client for the UniVise backend API.
// Keeps the base URL, auth header and JSON handling in one place.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const RETRYABLE_STATUSES = new Set([429, 503]);
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const SAFE_METHODS = new Set(["GET", "HEAD"]);

function apiUrl(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

// Thin wrapper over fetch. Returns the raw Response so callers that need
// streaming or their own status handling stay in control.
export async function apiFetch(path, { token, body, headers, retry, ...options } = {}) {
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

  const send = () =>
    fetch(apiUrl(path), {
      ...options,
      headers: finalHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

  const canRetry = retry ?? SAFE_METHODS.has((options.method || "GET").toUpperCase());
  let res = await send();
  for (const delayMs of RETRY_DELAYS_MS) {
    if (!canRetry || !RETRYABLE_STATUSES.has(res.status)) break;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    res = await send();
  }
  return res;
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
