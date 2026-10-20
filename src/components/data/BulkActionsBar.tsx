import { Button } from '../ui/Button'

type Props = {
  count: number
  onClear: () => void
}

export function BulkActionsBar({ count, onClear }: Props) {
  if (count === 0) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[12px] border border-primary/30 bg-primary/5 px-4 py-3">
      <span className="text-sm font-medium text-text">
        {count} selected
      </span>
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" className="h-9 px-3 text-xs">
          Delete
        </Button>
        <Button variant="secondary" className="h-9 px-3 text-xs">
          Transfer
        </Button>
        <Button variant="secondary" className="h-9 px-3 text-xs">
          Export
        </Button>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-sm text-muted hover:text-text"
      >
        Clear selection
      </button>
    </div>
  )
}
