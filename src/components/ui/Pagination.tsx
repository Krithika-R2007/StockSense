import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-end gap-1 pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-sm text-muted hover:bg-app disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={cn(
            'flex h-8 min-w-8 items-center justify-center rounded-[8px] text-sm',
            p === page
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-app',
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2 text-sm text-muted hover:bg-app disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
