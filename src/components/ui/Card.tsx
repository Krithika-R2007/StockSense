import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
  padding?: boolean
}

export function Card({
  children,
  className,
  title,
  action,
  padding = true,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-border bg-surface shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {title || action ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {title ? (
            <h3 className="text-base font-semibold text-text">{title}</h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className={padding ? 'p-4' : undefined}>{children}</div>
    </div>
  )
}
