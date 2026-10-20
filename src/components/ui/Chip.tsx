import { cn } from '../../lib/cn'

type Tone = 'good' | 'warning' | 'critical' | 'expired' | 'neutral' | 'info'

const tones: Record<Tone, string> = {
  good: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-orange-100 text-orange-800',
  expired: 'bg-red-100 text-red-800',
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-blue-100 text-blue-800',
}

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {label}
    </span>
  )
}
