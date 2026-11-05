import type { ReactElement } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DialogFooter, DialogHeader } from '@/components/ui/dialog'

type ConfirmDialogProps = {
  trigger: ReactElement
  title: string
  description: string
  confirmLabel: string
  pending: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <DialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </DialogHeader>
        <DialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
