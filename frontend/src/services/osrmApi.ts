import type { LngLat, WalkingRouteLeg } from '../types'

const RAW_OSRM_BASE_URL =
  (import.meta.env.VITE_OSRM_BASE_URL as string | undefined)?.trim() ||
  'https://routing.openstreetmap.de/routed-foot'
const OSRM_BASE_URL = RAW_OSRM_BASE_URL.replace(/\/$/, '')
const OSRM_PROFILE =
  (import.meta.env.VITE_OSRM_PROFILE as string | undefined)?.trim() || 'foot'
const OSRM_LOG_PREFIX = '[OSRM]'

console.info(`${OSRM_LOG_PREFIX} Base URL configured.`, {
  configured: RAW_OSRM_BASE_URL,
  resolved: OSRM_BASE_URL,
  profile: OSRM_PROFILE,
})

interface OsrmRouteResponse {
  code?: string
  message?: string
  routes?: Array<{
    geometry?: {
      type?: string
      coordinates?: LngLat[]
    }
  }>
}

const formatCoordinate = ([lng, lat]: LngLat) => `${lng},${lat}`

export const getWalkingRoute = async (
  from: LngLat,
  to: LngLat,
  signal?: AbortSignal,
): Promise<WalkingRouteLeg> => {
  const coordinatePath = `${formatCoordinate(from)};${formatCoordinate(to)}`
  const queryString = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'false',
    alternatives: 'false',
  })
  const url = `${OSRM_BASE_URL}/route/v1/${OSRM_PROFILE}/${coordinatePath}?${queryString.toString()}`

  console.info(`${OSRM_LOG_PREFIX} Walking route request start.`, { url })

  const response = await fetch(url, { signal })
  const payload = await response.json() as OsrmRouteResponse

  if (!response.ok || payload.code !== 'Ok') {
    throw new Error(payload.message ?? `OSRM request failed with status ${response.status}.`)
  }

  const geometry = payload.routes?.[0]?.geometry

  if (
    geometry?.type !== 'LineString' ||
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length < 2
  ) {
    throw new Error('OSRM did not return a valid walking route geometry.')
  }

  console.info(`${OSRM_LOG_PREFIX} Walking route request success.`, {
    coordinateCount: geometry.coordinates.length,
  })

  return {
    geometry: {
      type: 'LineString',
      coordinates: geometry.coordinates,
    },
  }
}
