import { useEffect, useState } from 'react'

import { getWalkingRoute } from '../services/osrmApi'
import type { LngLat, RouteOption, WalkingRouteLeg, WalkingRoutes } from '../types'

const WALKING_ROUTES_LOG_PREFIX = '[WalkingRoutes]'

const EMPTY_WALKING_ROUTES: WalkingRoutes = {
  originToBoard: null,
  alightToDestination: null,
}

const toPoint = (stop: RouteOption['from_stop']): LngLat => [stop.lng, stop.lat]

const getWalkingLeg = async (
  from: LngLat,
  to: LngLat,
  signal: AbortSignal,
  legName: string,
): Promise<WalkingRouteLeg | null> => {
  try {
    return await getWalkingRoute(from, to, signal)
  } catch (cause) {
    if (signal.aborted) {
      return null
    }

    const message = cause instanceof Error ? cause.message : 'Unknown OSRM error.'

    console.warn(`${WALKING_ROUTES_LOG_PREFIX} Walking route leg unavailable.`, {
      legName,
      message,
    })

    return null
  }
}

export const useWalkingRoutes = (
  fromPoint: LngLat | null,
  toPointValue: LngLat | null,
  selectedRoute: RouteOption | null,
): WalkingRoutes => {
  const [walkingRoutes, setWalkingRoutes] = useState<WalkingRoutes>(EMPTY_WALKING_ROUTES)

  useEffect(() => {
    if (!fromPoint || !toPointValue || !selectedRoute) {
      setWalkingRoutes(EMPTY_WALKING_ROUTES)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    setWalkingRoutes(EMPTY_WALKING_ROUTES)

    console.info(`${WALKING_ROUTES_LOG_PREFIX} Fetching walking route legs.`, {
      routeRef: selectedRoute.route.ref,
    })

    const loadWalkingRoutes = async () => {
      const [originToBoard, alightToDestination] = await Promise.all([
        getWalkingLeg(
          fromPoint,
          toPoint(selectedRoute.from_stop),
          controller.signal,
          'originToBoard',
        ),
        getWalkingLeg(
          toPoint(selectedRoute.to_stop),
          toPointValue,
          controller.signal,
          'alightToDestination',
        ),
      ])

      if (cancelled) {
        return
      }

      setWalkingRoutes({
        originToBoard,
        alightToDestination,
      })
    }

    void loadWalkingRoutes()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [fromPoint, selectedRoute, toPointValue])

  return walkingRoutes
}
