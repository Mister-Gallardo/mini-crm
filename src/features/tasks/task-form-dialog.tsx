import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { type ReactElement, Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { PendingScreen } from '@/components/route-states'
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
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { sitesQueryOptions } from '@/features/sites/api'
import { executorsQueryOptions, type TaskDetails, useSaveTask } from '@/features/tasks/api'

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(200, 'Не длиннее 200 символов'),
  description: z.string().trim().max(5000, 'Не длиннее 5000 символов'),
  site_id: z.string().min(1, 'Выберите объект'),
  assignee_id: z.string().min(1, 'Выберите исполнителя'),
})

type TaskFormDialogProps = {
  trigger: ReactElement
  task?: TaskDetails
  siteId?: string
}

export function TaskFormDialog({ trigger, task, siteId }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Редактирование задачи' : 'Новая задача'}</DialogTitle>
          <DialogDescription>Статус меняется только действиями в карточке задачи</DialogDescription>
        </DialogHeader>
        <Suspense fallback={<PendingScreen />}>
          <TaskForm task={task} siteId={siteId} onSaved={() => setOpen(false)} />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}

type TaskFormProps = {
  task?: TaskDetails
  siteId?: string
  onSaved: () => void
}

function TaskForm({ task, siteId, onSaved }: TaskFormProps) {
  const { data: sites } = useSuspenseQuery(sitesQueryOptions())
  const { data: executors } = useSuspenseQuery(executorsQueryOptions())
  const saveTask = useSaveTask()
  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      site_id: task?.site.id ?? siteId ?? '',
      assignee_id: task?.assignee.id ?? '',
    },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) =>
    saveTask.mutate(
      { taskId: task?.id, values },
      {
        onSuccess: () => {
          toast.success(task ? 'Задача сохранена' : 'Задача создана')
          onSaved()
        },
      },
    ),
  )

  return (
    <form className="grid gap-4" noValidate onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor="task-title">Название</FieldLabel>
        <Input id="task-title" aria-invalid={Boolean(errors.title)} {...form.register('title')} />
        <FieldError>{errors.title?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="task-description">Описание</FieldLabel>
        <Textarea
          id="task-description"
          aria-invalid={Boolean(errors.description)}
          {...form.register('description')}
        />
        <FieldError>{errors.description?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="task-site">Объект</FieldLabel>
        <NativeSelect
          id="task-site"
          aria-invalid={Boolean(errors.site_id)}
          {...form.register('site_id')}
        >
          <option value="" disabled>
            Выберите объект
          </option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </NativeSelect>
        <FieldError>{errors.site_id?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="task-assignee">Исполнитель</FieldLabel>
        <NativeSelect
          id="task-assignee"
          aria-invalid={Boolean(errors.assignee_id)}
          {...form.register('assignee_id')}
        >
          <option value="" disabled>
            Выберите исполнителя
          </option>
          {executors.map((executor) => (
            <option key={executor.id} value={executor.id}>
              {executor.full_name}
            </option>
          ))}
        </NativeSelect>
        <FieldError>{errors.assignee_id?.message}</FieldError>
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Отмена</Button>
        </DialogClose>
        <Button type="submit" disabled={saveTask.isPending}>
          {task ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogFooter>
    </form>
  )
}
