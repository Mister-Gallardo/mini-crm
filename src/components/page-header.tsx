import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  back?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <header className="grid gap-3">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
          {description && <div className="text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}
