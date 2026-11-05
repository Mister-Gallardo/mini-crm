import type { ReactNode } from 'react'

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground text-sm">
      {children}
    </div>
  )
}
