import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Drawer({ open, title, onClose, children, footer, wide }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <div
        className={`relative flex h-full flex-col bg-surface shadow-xl ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-[8px] p-2 hover:bg-app">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? (
          <div className="border-t border-border p-4">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
