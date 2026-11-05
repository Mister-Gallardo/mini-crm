import { Label as LabelPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="field" className={cn('grid gap-2', className)} {...props} />
}

function FieldLabel({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="field-label"
      className={cn('select-none font-medium text-sm leading-none', className)}
      {...props}
    />
  )
}

function FieldError({ className, children, ...props }: ComponentProps<'p'>) {
  if (!children) {
    return null
  }

  return (
    <p data-slot="field-error" className={cn('text-destructive text-sm', className)} {...props}>
      {children}
    </p>
  )
}

export { Field, FieldError, FieldLabel }
