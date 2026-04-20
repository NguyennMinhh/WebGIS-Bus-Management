import { useCallback, useRef, useState } from 'react'

import type { LngLat } from '../types'

export type SelectionMode = 'from' | 'to' | null

interface UsePointSelectionResult {
  fromPoint: LngLat | null
  toPoint: LngLat | null
  mode: SelectionMode
  bufferRadius: number
  isLocating: boolean
  errorMessage: string | null
  activateMode: (nextMode: SelectionMode) => void
  handleMapClick: (point: LngLat) => void
  setFromGPS: () => void
  setFromPlace: (point: LngLat) => void
  setToPlace: (point: LngLat) => void
  updateBufferRadius: (nextRadius: number) => void
  clear: () => void
}

export const usePointSelection = (): UsePointSelectionResult => {
  const [fromPoint, setFromPoint] = useState<LngLat | null>(null)
  const [toPoint, setToPoint] = useState<LngLat | null>(null)
  const [mode, setMode] = useState<SelectionMode>(null)
  const [bufferRadius, setBufferRadius] = useState(1000)
  const [isLocating, setIsLocating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const geolocationRequestIdRef = useRef(0)

  const applySelectedPoint = useCallback((target: Exclude<SelectionMode, null>, point: LngLat) => {
    geolocationRequestIdRef.current += 1
    setIsLocating(false)
    setErrorMessage(null)
    setMode(null)

    if (target === 'from') {
      setFromPoint(point)
      return
    }

    setToPoint(point)
  }, [])

  const activateMode = useCallback((nextMode: SelectionMode) => {
    geolocationRequestIdRef.current += 1
    setIsLocating(false)
    setErrorMessage(null)
    setMode((currentMode) => (currentMode === nextMode ? null : nextMode))
  }, [])

  const handleMapClick = useCallback((point: LngLat) => {
    if (mode === 'from') {
      applySelectedPoint('from', point)
      return
    }

    if (mode === 'to') {
      applySelectedPoint('to', point)
      return
    }
  }, [applySelectedPoint, mode])

  const setFromGPS = useCallback(() => {
    const requestId = geolocationRequestIdRef.current + 1
    geolocationRequestIdRef.current = requestId

    setIsLocating(true)
    setErrorMessage(null)
    setMode('from')

    if (!navigator.geolocation) {
      setIsLocating(false)
      setErrorMessage('This browser does not support geolocation.')
      console.error('[PointSelection] Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (geolocationRequestIdRef.current !== requestId) return

        const point: LngLat = [coords.longitude, coords.latitude]

        setIsLocating(false)
        setFromPoint(point)
        setErrorMessage(null)
        setMode(null)
      },
      (error) => {
        if (geolocationRequestIdRef.current !== requestId) return

        const nextError = `Could not get your location: ${error.message}`

        setIsLocating(false)
        setErrorMessage(nextError)
        console.error('[PointSelection] Geolocation request failed.', {
          code: error.code,
          message: error.message,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [])

  const updateBufferRadius = useCallback((nextRadius: number) => {
    setBufferRadius(nextRadius)
  }, [])

  const setFromPlace = useCallback((point: LngLat) => {
    applySelectedPoint('from', point)
  }, [applySelectedPoint])

  const setToPlace = useCallback((point: LngLat) => {
    applySelectedPoint('to', point)
  }, [applySelectedPoint])

  const clear = useCallback(() => {
    geolocationRequestIdRef.current += 1
    setIsLocating(false)
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
    isLocating,
    errorMessage,
    activateMode,
    handleMapClick,
    setFromGPS,
    setFromPlace,
    setToPlace,
    updateBufferRadius,
    clear,
  }
}
