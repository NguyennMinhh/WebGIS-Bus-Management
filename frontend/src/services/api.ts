import type { PlaceDetail, PlaceSuggestion, RouteOption } from '../types'

const RAW_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '/api'
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '')
const API_LOG_PREFIX = '[API]'

console.info(`${API_LOG_PREFIX} Base URL configured.`, {
  configured: RAW_BASE_URL,
  resolved: BASE_URL,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractFieldError = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = extractFieldError(item)

      if (message) {
        return message
      }
    }
  }

  if (isRecord(value)) {
    for (const nestedValue of Object.values(value)) {
      const message = extractFieldError(nestedValue)

      if (message) {
        return message
      }
    }
  }

  return null
}

const extractErrorMessage = (payload: unknown, status: number, path: string) => {
  if (isRecord(payload)) {
    const message = payload.error ?? payload.detail ?? payload.message

    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }

    const fieldMessage = extractFieldError(payload)

    if (fieldMessage) {
      return fieldMessage
    }
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload
  }

  return `API error ${status}: ${path}`
}

const parseResponseBody = async (response: Response) => {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json() as Promise<unknown>
  }

  const text = await response.text()
  return text.length > 0 ? text : null
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  const method = init?.method ?? 'GET'

  console.info(`${API_LOG_PREFIX} Request start`, { method, url })

  const response = await fetch(url, {
    method,
    ...init,
  })
  const payload = await parseResponseBody(response)

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status, path)

    console.error(`${API_LOG_PREFIX} Request failed`, {
      url,
      method,
      status: response.status,
      payload,
    })

    throw new ApiError(message, response.status, payload)
  }

  console.info(`${API_LOG_PREFIX} Request success`, {
    url,
    method,
    status: response.status,
  })

  return payload as T
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, {
    method: 'GET',
    ...init,
  })
}

interface FindRouteParams {
  from_lat: number
  from_lng: number
  to_lat: number
  to_lng: number
  buffer?: number
}

export const findRoute = (
  params: FindRouteParams,
  signal?: AbortSignal,
): Promise<RouteOption[]> => {
  const queryString = new URLSearchParams({
    from_lat: String(params.from_lat),
    from_lng: String(params.from_lng),
    to_lat: String(params.to_lat),
    to_lng: String(params.to_lng),
    ...(params.buffer ? { buffer: String(params.buffer) } : {}),
  })

  return get<RouteOption[]>(`/find-route/?${queryString.toString()}`, { signal })
}

export const placeAutocomplete = (
  input: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> => {
  const queryString = new URLSearchParams({
    input,
  })

  return get<PlaceSuggestion[]>(`/places/autocomplete/?${queryString.toString()}`, { signal })
}

export const placeDetail = (
  placeId: string,
  signal?: AbortSignal,
): Promise<PlaceDetail> => {
  const queryString = new URLSearchParams({
    place_id: placeId,
  })

  return get<PlaceDetail>(`/places/detail/?${queryString.toString()}`, { signal })
}

export const api = {
  apiRequest,
  get,
  findRoute,
  placeAutocomplete,
  placeDetail,
}
