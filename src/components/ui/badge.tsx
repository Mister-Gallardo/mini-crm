import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Badge({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
