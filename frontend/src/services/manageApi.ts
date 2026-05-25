import { apiRequest } from './api'
import type {
  BusRoute,
  BusRouteDetail,
  BusRouteInput,
  BusStop,
  BusStopInput,
  RouteStop,
} from '../types'

const jsonRequest = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

const buildSearchPath = (path: string, search?: string) => {
  const query = search?.trim()

  if (!query) {
    return path
  }

  return `${path}?search=${encodeURIComponent(query)}`
}

export const listStops = (search?: string) =>
  apiRequest<BusStop[]>(buildSearchPath('/manage/stops/', search))

export const getStop = (id: number | string) =>
  apiRequest<BusStop>(`/manage/stops/${id}/`)

export const createStop = (payload: BusStopInput) =>
  jsonRequest<BusStop>('/manage/stops/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateStop = (id: number | string, payload: BusStopInput) =>
  jsonRequest<BusStop>(`/manage/stops/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteStop = (id: number | string) =>
  apiRequest<void>(`/manage/stops/${id}/`, {
    method: 'DELETE',
  })

export const listRoutes = (search?: string) =>
  apiRequest<BusRoute[]>(buildSearchPath('/manage/routes/', search))

export const getRoute = (id: number | string) =>
  apiRequest<BusRouteDetail>(`/manage/routes/${id}/`)

export const createRoute = (payload: BusRouteInput) =>
  jsonRequest<BusRoute>('/manage/routes/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateRoute = (id: number | string, payload: BusRouteInput) =>
  jsonRequest<BusRoute>(`/manage/routes/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteRoute = (id: number | string) =>
  apiRequest<void>(`/manage/routes/${id}/`, {
    method: 'DELETE',
  })

export const addStopToRoute = (routeId: number | string, stopId: number | string) =>
  jsonRequest<{ stops: RouteStop[] }>(`/manage/routes/${routeId}/add-stop/`, {
    method: 'POST',
    body: JSON.stringify({ stop_id: stopId }),
  })

export const removeStopFromRoute = (routeId: number | string, stopId: number | string) =>
  apiRequest<{ stops: RouteStop[] }>(
    `/manage/routes/${routeId}/remove-stop/${stopId}/`,
    {
      method: 'DELETE',
    },
  )
