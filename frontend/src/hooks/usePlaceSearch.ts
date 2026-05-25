import { useCallback, useEffect, useRef, useState } from 'react'

import { placeAutocomplete, placeDetail } from '../services/api'
import type { PlaceDetail, PlaceSuggestion } from '../types'

const PLACE_SEARCH_LOG_PREFIX = '[PlaceSearch]'
const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300
const MAX_SUGGESTIONS = 5

export type PlaceSearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface UsePlaceSearchResult {
  query: string
  suggestions: PlaceSuggestion[]
  status: PlaceSearchStatus
  error: string | null
  isResolving: boolean
  setQuery: (nextQuery: string) => void
  clear: () => void
  resolvePlace: (placeId: string) => Promise<PlaceDetail | null>
}

export const usePlaceSearch = (): UsePlaceSearchResult => {
  const [query, setQueryState] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [status, setStatus] = useState<PlaceSearchStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const autocompleteRequestIdRef = useRef(0)
  const autocompleteControllerRef = useRef<AbortController | null>(null)
  const detailControllerRef = useRef<AbortController | null>(null)

  const abortAutocompleteRequest = useCallback((reason: string) => {
    if (!autocompleteControllerRef.current) {
      return
    }

    console.debug(`${PLACE_SEARCH_LOG_PREFIX} Aborting autocomplete request.`, {
      reason,
    })

    autocompleteControllerRef.current.abort()
    autocompleteControllerRef.current = null
  }, [])

  const abortDetailRequest = useCallback((reason: string) => {
    if (!detailControllerRef.current) {
      return
    }

    console.debug(`${PLACE_SEARCH_LOG_PREFIX} Aborting place detail request.`, {
      reason,
    })

    detailControllerRef.current.abort()
    detailControllerRef.current = null
  }, [])

  const setQuery = useCallback((nextQuery: string) => {
    abortDetailRequest('query-changed')
    setIsResolving(false)
    setQueryState(nextQuery)
  }, [abortDetailRequest])

  const clear = useCallback(() => {
    autocompleteRequestIdRef.current += 1
    abortAutocompleteRequest('manual-clear')
    abortDetailRequest('manual-clear')
    setQueryState('')
    setSuggestions([])
    setStatus('idle')
    setError(null)
    setIsResolving(false)
  }, [abortAutocompleteRequest, abortDetailRequest])

  const resolvePlace = useCallback(async (placeId: string) => {
    abortDetailRequest('detail-restart')

    const controller = new AbortController()
    detailControllerRef.current = controller

    console.info(`${PLACE_SEARCH_LOG_PREFIX} Place detail request started.`, {
      placeId,
    })

    setIsResolving(true)
    setError(null)

    try {
      const resolvedPlace = await placeDetail(placeId, controller.signal)

      console.info(`${PLACE_SEARCH_LOG_PREFIX} Place detail request succeeded.`, {
        placeId,
        lat: resolvedPlace.lat,
        lng: resolvedPlace.lng,
      })

      return resolvedPlace
    } catch (cause: unknown) {
      if (controller.signal.aborted) {
        console.debug(`${PLACE_SEARCH_LOG_PREFIX} Place detail request aborted.`, {
          placeId,
        })
        return null
      }

      const message =
        cause instanceof Error ? cause.message : 'Place detail failed unexpectedly.'

      console.error(`${PLACE_SEARCH_LOG_PREFIX} Place detail request failed.`, {
        placeId,
        message,
        cause,
      })

      setError(message)
      return null
    } finally {
      if (detailControllerRef.current === controller) {
        detailControllerRef.current = null
      }

      setIsResolving(false)
    }
  }, [abortDetailRequest])

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      autocompleteRequestIdRef.current += 1
      abortAutocompleteRequest('query-too-short')
      setSuggestions([])
      setStatus('idle')
      setError(null)
      return
    }

    setSuggestions([])
    setStatus('loading')
    setError(null)

    const timeoutId = window.setTimeout(async () => {
      abortAutocompleteRequest('autocomplete-restart')

      const requestId = autocompleteRequestIdRef.current + 1
      const controller = new AbortController()
      autocompleteRequestIdRef.current = requestId
      autocompleteControllerRef.current = controller

      console.info(`${PLACE_SEARCH_LOG_PREFIX} Autocomplete request started.`, {
        query: trimmedQuery,
        requestId,
      })

      try {
        const predictions = await placeAutocomplete(trimmedQuery, controller.signal)

        if (autocompleteRequestIdRef.current !== requestId) {
          console.debug(`${PLACE_SEARCH_LOG_PREFIX} Ignored stale autocomplete response.`, {
            requestId,
          })
          return
        }

        const nextSuggestions = predictions.slice(0, MAX_SUGGESTIONS)

        console.info(`${PLACE_SEARCH_LOG_PREFIX} Autocomplete request succeeded.`, {
          query: trimmedQuery,
          requestId,
          resultCount: nextSuggestions.length,
        })

        setSuggestions(nextSuggestions)
        setStatus('success')
      } catch (cause: unknown) {
        if (controller.signal.aborted) {
          console.debug(`${PLACE_SEARCH_LOG_PREFIX} Autocomplete request aborted.`, {
            requestId,
          })
          return
        }

        if (autocompleteRequestIdRef.current !== requestId) {
          console.debug(`${PLACE_SEARCH_LOG_PREFIX} Ignored stale failed autocomplete response.`, {
            requestId,
          })
          return
        }

        const message =
          cause instanceof Error ? cause.message : 'Place search failed unexpectedly.'

        console.error(`${PLACE_SEARCH_LOG_PREFIX} Autocomplete request failed.`, {
          query: trimmedQuery,
          requestId,
          message,
          cause,
        })

        setSuggestions([])
        setStatus('error')
        setError(message)
      } finally {
        if (autocompleteControllerRef.current === controller) {
          autocompleteControllerRef.current = null
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [abortAutocompleteRequest, query])

  useEffect(() => {
    return () => {
      abortAutocompleteRequest('hook-unmount')
      abortDetailRequest('hook-unmount')
    }
  }, [abortAutocompleteRequest, abortDetailRequest])

  return {
    query,
    suggestions,
    status,
    error,
    isResolving,
    setQuery,
    clear,
    resolvePlace,
  }
}
