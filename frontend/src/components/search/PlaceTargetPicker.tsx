import type { SelectionMode } from '../../hooks/usePointSelection'

type PlaceTarget = Exclude<SelectionMode, null>

interface PlaceTargetPickerProps {
  placeName: string
  onPick: (target: PlaceTarget) => void
}

export const PlaceTargetPicker = ({
  placeName,
  onPick,
}: PlaceTargetPickerProps) => {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Use Selected Place As
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">
        {placeName}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onPick('from')}
          className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          From
        </button>
        <button
          type="button"
          onClick={() => onPick('to')}
          className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          To
        </button>
      </div>
    </div>
  )
}
