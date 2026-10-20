import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function Input({ label, className, id, ...props }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="flex flex-col gap-2 text-left">
      {label ? (
        <span className="text-sm font-medium text-text">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20',
          className,
        )}
        {...props}
      />
    </label>
  )
}
