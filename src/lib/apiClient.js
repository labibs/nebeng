// src/lib/apiClient.js
// Centralized API client that auto-injects Clerk JWT into every request

let getTokenFn = null

/**
 * Initialize the API client with Clerk's getToken function.
 * Call this once at app startup (e.g., in main.jsx).
 */
export function initApiClient(getToken) {
    getTokenFn = getToken
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Fetch wrapper that adds Authorization header with Clerk JWT.
 * @param {string} path - API path, e.g. '/api/cart'
 * @param {RequestInit} options - fetch options
 * @returns {Promise<any>} - parsed JSON response
 */
export async function apiFetch(path, options = {}) {
    let token = null
    if (getTokenFn) {
        try {
            token = await getTokenFn()
        } catch (err) {
            console.warn('Failed to get Clerk token:', err)
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`API Error ${response.status}: ${errorBody}`)
    }

    // Handle empty responses (e.g. 204 No Content)
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
        return response.json()
    }

    return null
}
