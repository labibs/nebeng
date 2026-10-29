import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from './apiClient'

// Module-level cache persists across component remounts / route navigations
const cache = new Map()

/**
 * useCachedFetch - stale-while-revalidate cache hook
 *
 * - Returns cached data instantly (no loading flash)
 * - Fetches fresh data in background
 * - Supports force refresh (pull-to-refresh)
 *
 * @param {string} key   - unique cache key (e.g. '/posts' or '/market/products?category=food')
 * @param {object} opts  - { ttl, enabled, fetcher }
 *   ttl     : cache lifetime in ms (default 30000 = 30s)
 *   enabled : set false to skip fetch (e.g. when user not loaded)
 *   fetcher : custom async function(key) => data. Defaults to apiFetch(key)
 */
export function useCachedFetch(key, opts = {}) {
  const { ttl = 30_000, enabled = true, fetcher } = opts

  const cached = cache.get(key)
  const [data, setData] = useState(cached?.data ?? null)
  const [loading, setLoading] = useState(!cached) // skip loading if cached
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const fetchFresh = useCallback(async (forceRefresh = false) => {
    if (!enabled) return

    const existing = cache.get(key)

    // If we have fresh cache and not forcing refresh, use it
    if (!forceRefresh && existing && Date.now() - existing.timestamp < ttl) {
      setData(existing.data)
      setLoading(false)
      return existing.data
    }

    // Show cached data immediately while fetching in background
    if (existing) {
      setData(existing.data)
      setLoading(false) // no loading spinner, show stale data
    } else {
      setLoading(true)
    }

    try {
      const fresh = await (fetcher ? fetcher(key) : apiFetch(key))
      if (!mountedRef.current) return fresh

      const entry = { data: fresh, timestamp: Date.now() }
      cache.set(key, entry)
      setData(fresh)
      setError(null)
      return fresh
    } catch (err) {
      if (!mountedRef.current) return null
      setError(err)
      // Keep stale data visible on error
      return existing?.data ?? null
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [key, ttl, enabled, fetcher])

  useEffect(() => {
    mountedRef.current = true
    fetchFresh()
    return () => { mountedRef.current = false }
  }, [fetchFresh])

  // refresh = force re-fetch (for pull-to-refresh)
  const refresh = useCallback(() => fetchFresh(true), [fetchFresh])

  // invalidate = remove from cache so next fetch is fresh
  const invalidate = useCallback(() => {
    cache.delete(key)
  }, [key])

  return { data, loading, error, refresh, invalidate, setData }
}

/**
 * Manually invalidate a cache key (e.g. after creating a new post)
 */
export function invalidateCache(key) {
  cache.delete(key)
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
  cache.clear()
}
