import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'

import type { SelectionMode } from '../../hooks/usePointSelection'
import { usePlaceSearch } from '../../hooks/usePlaceSearch'
import type { PlaceDetail, PlaceSuggestion } from '../../types'
import { PlaceTargetPicker } from './PlaceTargetPicker'

type PlaceTarget = Exclude<SelectionMode, null>

interface PlaceSearchBoxProps {
  onPick: (target: PlaceTarget, place: PlaceDetail) => void
}

const MIN_QUERY_LENGTH = 2

const formatSuggestionLabel = (suggestion: PlaceSuggestion) =>
  suggestion.main_text || suggestion.description

export const PlaceSearchBox = ({ onPick }: PlaceSearchBoxProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    suggestions,
    status,
    error,
    isResolving,
    setQuery,
    clear,
    resolvePlace,
  } = usePlaceSearch()
  const [isFocused, setIsFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [pendingPlace, setPendingPlace] = useState<PlaceDetail | null>(null)
  const [pendingPlaceLabel, setPendingPlaceLabel] = useState('')
  const hasMinQueryLength = query.trim().length >= MIN_QUERY_LENGTH
  const showEmptyState = status === 'success' && suggestions.length === 0
  const showDropdown =
    isFocused &&
    !pendingPlace &&
    !isResolving &&
    hasMinQueryLength &&
    (status === 'loading' || suggestions.length > 0 || Boolean(error) || showEmptyState)

  useEffect(() => {
    if (!showDropdown || suggestions.length === 0) {
      setHighlightedIndex(-1)
      return
    }

    setHighlightedIndex((currentIndex) => {
      if (currentIndex < 0 || currentIndex >= suggestions.length) {
        return 0
      }

      return currentIndex
    })
  }, [showDropdown, suggestions.length])

  const closeTransientPanels = () => {
    setPendingPlace(null)
    setPendingPlaceLabel('')
    setHighlightedIndex(-1)
  }

  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget

    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
      return
    }

    setIsFocused(false)
    closeTransientPanels()
  }

  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    const resolvedPlace = await resolvePlace(suggestion.place_id)

    if (!resolvedPlace) {
      return
    }

    setPendingPlace(resolvedPlace)
    setPendingPlaceLabel(resolvedPlace.name || formatSuggestionLabel(suggestion))
    setHighlightedIndex(-1)
  }

  const handleInputChange = (nextQuery: string) => {
    closeTransientPanels()
    setIsFocused(true)
    setQuery(nextQuery)
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsFocused(false)
      closeTransientPanels()
      inputRef.current?.blur()
      return
    }

    if (pendingPlace || !showDropdown || suggestions.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((currentIndex) => {
        const nextIndex = currentIndex + 1
        return nextIndex >= suggestions.length ? 0 : nextIndex
      })
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((currentIndex) => {
        if (currentIndex <= 0) {
          return suggestions.length - 1
        }

        return currentIndex - 1
      })
      return
    }

    if (event.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      event.preventDefault()
      await handleSuggestionSelect(suggestions[highlightedIndex])
    }
  }

  const handleTargetPick = (target: PlaceTarget) => {
    if (!pendingPlace) {
      return
    }

    onPick(target, pendingPlace)
    clear()
    closeTransientPanels()
    setIsFocused(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative" onBlur={handleContainerBlur}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={(event) => {
            void handleKeyDown(event)
          }}
          placeholder="Search places in Hanoi"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          aria-label="Search place by name"
          autoComplete="off"
        />
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-slate-400">
          {isResolving ? 'Loading...' : 'Goong'}
        </div>
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {status === 'loading' ? (
            <div className="px-4 py-3 text-sm text-slate-500">
              Searching places...
            </div>
          ) : null}

          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {showEmptyState ? (
            <div className="px-4 py-3 text-sm text-slate-500">
              No places matched this query.
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-2">
              {suggestions.map((suggestion, index) => {
                const isHighlighted = index === highlightedIndex

                return (
                  <li key={suggestion.place_id}>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        void handleSuggestionSelect(suggestion)
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isHighlighted ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {formatSuggestionLabel(suggestion)}
                        </span>
                        {suggestion.secondary_text ? (
                          <span className="mt-1 block truncate text-xs text-slate-500">
                            {suggestion.secondary_text}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {pendingPlace ? (
        <PlaceTargetPicker
          placeName={pendingPlaceLabel}
          onPick={handleTargetPick}
        />
      ) : null}
    </div>
  )
}
