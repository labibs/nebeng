let getUserIdFn = null
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')

export function initApiClient(config) {
  if (typeof config === 'function') return
  getUserIdFn = config?.getUserId || null
}

function getCurrentUserId() {
  return getUserIdFn ? getUserIdFn() : null
}

async function parseBody(options) {
  if (!options?.body) return null
  if (typeof options.body === 'string') return JSON.parse(options.body)
  return options.body
}

async function requestBackend(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const clerkId = getCurrentUserId()
  const headers = new Headers(options.headers || {})

  if (clerkId) {
    headers.set('X-Clerk-User-Id', clerkId)
  }
  headers.set('Accept', 'application/json')

  const init = {
    method,
    headers,
  }

  if (method !== 'GET' && method !== 'HEAD') {
    if (options.body != null) {
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    }
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const response = await fetch(url, init)
  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null
      ? data.error || data.message || JSON.stringify(data)
      : text || response.statusText || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function apiFetch(path, options = {}) {
  return requestBackend(path, options)
}
