const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

export async function apiFetch(path, { clerkId, method = "GET", body, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (clerkId) requestHeaders.set("X-Clerk-User-Id", clerkId);
  const init = { method, headers: requestHeaders };

  if (body !== undefined && method.toUpperCase() !== "GET") {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    if (!requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`, init);
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!response.ok) {
    const message = typeof data === "object" && data
      ? data.message || data.error || JSON.stringify(data)
      : text || response.statusText || "API request failed";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
