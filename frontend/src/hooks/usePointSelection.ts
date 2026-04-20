import { useCallback, useState } from 'react'

import type { LngLat } from '../types'

export type SelectionMode = 'from' | 'to' | null

interface UsePointSelectionResult {
  fromPoint: LngLat | null
  toPoint: LngLat | null
  mode: SelectionMode
  bufferRadius: number
  errorMessage: string | null
  activateMode: (nextMode: SelectionMode) => void
  handleMapClick: (point: LngLat) => void
  setFromGPS: () => void
  updateBufferRadius: (nextRadius: number) => void
  clear: () => void
}

export const usePointSelection = (): UsePointSelectionResult => {
  const [fromPoint, setFromPoint] = useState<LngLat | null>(null)
  const [toPoint, setToPoint] = useState<LngLat | null>(null)
  const [mode, setMode] = useState<SelectionMode>(null)
  const [bufferRadius, setBufferRadius] = useState(1000)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activateMode = useCallback((nextMode: SelectionMode) => {
    console.log('[PointSelection] Step 1: toggle selection mode', { nextMode })
    setErrorMessage(null)
    setMode((currentMode) => {
      const resolvedMode = currentMode === nextMode ? null : nextMode
      console.log('[PointSelection] Step 2: selection mode updated', {
        currentMode,
        resolvedMode,
      })
      return resolvedMode
    })
  }, [])

  const handleMapClick = useCallback((point: LngLat) => {
    console.log('[PointSelection] Step 3: map click received', { mode, point })
    setErrorMessage(null)

    if (mode === 'from') {
      console.log('[PointSelection] Step 4: set from point from map click', { point })
      setFromPoint(point)
      setMode(null)
      return
    }

    if (mode === 'to') {
      console.log('[PointSelection] Step 4: set to point from map click', { point })
      setToPoint(point)
      setMode(null)
      return
    }

    console.log('[PointSelection] Step 4: ignore map click because no mode is active')
  }, [mode])

  const setFromGPS = useCallback(() => {
    console.log('[PointSelection] Step 5: start geolocation request for from point')
    setErrorMessage(null)
    setMode('from')

    if (!navigator.geolocation) {
      const nextError = 'This browser does not support geolocation.'
      console.log('[PointSelection] Step 6: geolocation unavailable', { nextError })
      setErrorMessage(nextError)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point: LngLat = [coords.longitude, coords.latitude]
        console.log('[PointSelection] Step 6: geolocation resolved', { point })
        setFromPoint(point)
        setMode(null)
      },
      (error) => {
        const nextError = `Could not get your location: ${error.message}`
        console.log('[PointSelection] Step 6: geolocation failed', {
          code: error.code,
          message: error.message,
        })
        setErrorMessage(nextError)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [])

  const updateBufferRadius = useCallback((nextRadius: number) => {
    console.log('[PointSelection] Step 7: update buffer radius', { nextRadius })
    setBufferRadius(nextRadius)
  }, [])

  const clear = useCallback(() => {
    console.log('[PointSelection] Step 8: clear selection state')
    setFromPoint(null)
    setToPoint(null)
    setMode(null)
    setErrorMessage(null)
  }, [])

  return {
    fromPoint,
    toPoint,
    mode,
    bufferRadius,
    errorMessage,
    activateMode,
    handleMapClick,
    setFromGPS,
    updateBufferRadius,
    clear,
  }
}
