import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'destructiveOutline' | 'success'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover border-transparent shadow-sm',
  secondary:
    'bg-surface text-text border-border hover:bg-app border',
  ghost: 'bg-transparent text-text border-transparent hover:bg-app',
  destructive: 'bg-error text-white hover:bg-red-700 border-transparent',
  destructiveOutline:
    'bg-surface text-error border-error hover:bg-red-50 border',
  success: 'bg-success text-white hover:bg-green-700 border-transparent',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  className,
  children,
  icon,
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-medium transition-colors disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
