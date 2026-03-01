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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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
        console.log(`[API] 🔐 Token obtained (length: ${token.length})`)
    } else {
        console.warn(`[API] ⚠️  No token available!`)
    }

    const url = `${API_URL}${path}`
    console.log(`[API] 📤 REQUEST: ${options.method || 'GET'} ${url}`)
    console.log(`[API] 📋 Headers:`, { Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'NONE', 'Content-Type': 'application/json' })

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        })

        console.log(`[API] 📥 RESPONSE Status: ${response.status} ${response.statusText}`)
        console.log(`[API] 📑 Response Headers:`, {
            'content-type': response.headers.get('content-type'),
            'content-length': response.headers.get('content-length')
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error(`[API] ❌ ERROR RESPONSE:`, errorBody)
            throw new Error(`API Error ${response.status}: ${errorBody}`)
        }

        // Handle empty responses (e.g. 204 No Content)
        // read the body text in all cases so we can inspect it
        const text = await response.text()
        if (!text) {
            console.warn(`[API] ⚠️  Empty response body (${response.status})`)
            return null
        }
        // try parsing JSON regardless of header
        try {
            const data = JSON.parse(text)
            console.log(`[API] ✅ SUCCESS Data:`, data)
            console.log(`[API] 📊 Data type:`, Array.isArray(data) ? `Array(${data.length})` : typeof data)
            return data
        } catch (parseErr) {
            console.error(`[API] 💥 JSON parse error for ${url}:`, parseErr)
            console.error(`[API] 💥 Response text:`, text)
            throw parseErr
        }
    } catch (err) {
        console.error(`[API] 💥 FETCH ERROR for ${url}:`, err)
        throw err
    }
}
