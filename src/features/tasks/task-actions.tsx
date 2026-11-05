import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/input'
import {
  type TaskStatus,
  taskTransitionsQueryOptions,
  useChangeTaskStatus,
} from '@/features/tasks/api'
import { getTransitionLabel, taskStatusLabel } from '@/features/tasks/status'

export function TaskActions({ taskId }: { taskId: string }) {
  const { data: transitions } = useSuspenseQuery(taskTransitionsQueryOptions(taskId))
  const changeStatus = useChangeTaskStatus(taskId)

  if (transitions.length === 0) {
    return <p className="text-muted-foreground text-sm">Сейчас для вас нет доступных действий</p>
  }

  const change = (nextStatus: TaskStatus, comment?: string, onDone?: () => void) =>
    changeStatus.mutate(
      { nextStatus, comment },
      {
        onSuccess: () => {
          toast.success(`Статус: ${taskStatusLabel[nextStatus]}`)
          onDone?.()
        },
      },
    )

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map(({ to_status: nextStatus, comment_required: commentRequired }) =>
        commentRequired ? (
          <CommentDialog
            key={nextStatus}
            label={getTransitionLabel(nextStatus)}
            pending={changeStatus.isPending}
            onSubmit={(comment, onDone) => change(nextStatus, comment, onDone)}
          />
        ) : (
          <Button
            key={nextStatus}
            disabled={changeStatus.isPending}
            onClick={() => change(nextStatus)}
          >
            {getTransitionLabel(nextStatus)}
          </Button>
        ),
      )}
    </div>
  )
}

const commentSchema = z.object({
  comment: z.string().trim().min(1, 'Напишите комментарий').max(2000, 'Не длиннее 2000 символов'),
})

type CommentDialogProps = {
  label: string
  pending: boolean
  onSubmit: (comment: string, onDone: () => void) => void
}

function CommentDialog({ label, pending, onSubmit }: CommentDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(commentSchema), defaultValues: { comment: '' } })
  const { errors } = form.formState

  const close = () => {
    setOpen(false)
    form.reset()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true)
    } else {
      close()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Комментарий обязателен и сохранится в истории задачи
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          noValidate
          onSubmit={form.handleSubmit(({ comment }) => onSubmit(comment, close))}
        >
          <Field>
            <FieldLabel htmlFor="transition-comment">Комментарий</FieldLabel>
            <Textarea
              id="transition-comment"
              aria-invalid={Boolean(errors.comment)}
              {...form.register('comment')}
            />
            <FieldError>{errors.comment?.message}</FieldError>
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
