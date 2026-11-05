import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteTask } from '@/features/tasks/api'

type DeleteTaskButtonProps = {
  taskId: string
  siteId: string
}

export function DeleteTaskButton({ taskId, siteId }: DeleteTaskButtonProps) {
  const navigate = useNavigate()
  const deleteTask = useDeleteTask()

  return (
    <ConfirmDialog
      trigger={<Button variant="outline">Удалить</Button>}
      title="Удалить задачу?"
      description="Задача и её история будут удалены без возможности восстановления."
      confirmLabel="Удалить"
      pending={deleteTask.isPending}
      onConfirm={() =>
        deleteTask.mutate(taskId, {
          onSuccess: () => {
            toast.success('Задача удалена')
            return navigate({ to: '/sites/$siteId', params: { siteId }, replace: true })
          },
        })
      }
    />
  )
}
