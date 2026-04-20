import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, findRoute } from '../services/api'
import type { LngLat, RouteOption } from '../types'

const ROUTE_SEARCH_LOG_PREFIX = '[RouteSearch]'

export type RouteSearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseRouteSearchResult {
  results: RouteOption[]
  status: RouteSearchStatus
  error: string | null
  emptyMessage: string | null
  search: () => Promise<void>
}

export const useRouteSearch = (
  fromPoint: LngLat | null,
  toPoint: LngLat | null,
  bufferRadius: number,
): UseRouteSearchResult => {
  const [results, setResults] = useState<RouteOption[]>([])
  const [status, setStatus] = useState<RouteSearchStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const activeControllerRef = useRef<AbortController | null>(null)

  const abortActiveRequest = useCallback((reason: string) => {
    if (!activeControllerRef.current) {
      return
    }

    console.debug(`${ROUTE_SEARCH_LOG_PREFIX} Aborting in-flight request.`, {
      reason,
    })

    activeControllerRef.current.abort()
    activeControllerRef.current = null
  }, [])

  const search = useCallback(async () => {
    if (!fromPoint || !toPoint) {
      console.info(`${ROUTE_SEARCH_LOG_PREFIX} Search skipped because one or both points are missing.`, {
        fromPoint,
        toPoint,
      })
      return
    }

    abortActiveRequest('manual-search-restart')

    const requestId = requestIdRef.current + 1
    const controller = new AbortController()
    requestIdRef.current = requestId
    activeControllerRef.current = controller

    console.info(`${ROUTE_SEARCH_LOG_PREFIX} Search started.`, {
      requestId,
      fromPoint,
      toPoint,
      bufferRadius,
    })

    setStatus('loading')
    setError(null)
    setEmptyMessage(null)

    try {
      const data = await findRoute(
        {
          from_lat: fromPoint[1],
          from_lng: fromPoint[0],
          to_lat: toPoint[1],
          to_lng: toPoint[0],
          buffer: bufferRadius,
        },
        controller.signal,
      )

      if (requestIdRef.current !== requestId) {
        console.debug(
          `${ROUTE_SEARCH_LOG_PREFIX} Ignored stale success response.`,
          { requestId },
        )
        return
      }

      console.info(`${ROUTE_SEARCH_LOG_PREFIX} Search succeeded.`, {
        requestId,
        resultCount: data.length,
      })

      setResults(data)
      setStatus('success')
      setError(null)
      setEmptyMessage(
        data.length === 0 ? 'No direct route found. Try increasing the buffer radius.' : null,
      )
    } catch (cause: unknown) {
      if (controller.signal.aborted) {
        console.debug(`${ROUTE_SEARCH_LOG_PREFIX} Search aborted.`, {
          requestId,
        })
        return
      }

      if (requestIdRef.current !== requestId) {
        console.debug(
          `${ROUTE_SEARCH_LOG_PREFIX} Ignored stale failed response.`,
          { requestId },
        )
        return
      }

      if (cause instanceof ApiError && cause.status === 404) {
        console.info(`${ROUTE_SEARCH_LOG_PREFIX} Search completed with no direct results.`, {
          requestId,
          message: cause.message,
        })

        setResults([])
        setStatus('success')
        setError(null)
        setEmptyMessage(cause.message)
        return
      }

      const message =
        cause instanceof Error ? cause.message : 'Route search failed unexpectedly.'

      console.error(`${ROUTE_SEARCH_LOG_PREFIX} Search failed.`, {
        requestId,
        message,
        cause,
      })

      setResults([])
      setStatus('error')
      setError(message)
      setEmptyMessage(null)
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null
      }
    }
  }, [abortActiveRequest, bufferRadius, fromPoint, toPoint])

  useEffect(() => {
    if (fromPoint !== null || toPoint !== null) {
      return
    }

    requestIdRef.current += 1
    abortActiveRequest('points-cleared')

    console.info(`${ROUTE_SEARCH_LOG_PREFIX} Search state reset because both points were cleared.`)

    setResults([])
    setStatus('idle')
    setError(null)
    setEmptyMessage(null)
  }, [abortActiveRequest, fromPoint, toPoint])

  useEffect(() => {
    return () => {
      abortActiveRequest('hook-unmount')
    }
  }, [abortActiveRequest])

  return { results, status, error, emptyMessage, search }
}
