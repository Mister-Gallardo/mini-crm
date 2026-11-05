import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteSite } from '@/features/sites/api'

type DeleteSiteButtonProps = {
  siteId: string
  hasTasks: boolean
}

export function DeleteSiteButton({ siteId, hasTasks }: DeleteSiteButtonProps) {
  const navigate = useNavigate()
  const deleteSite = useDeleteSite()

  if (hasTasks) {
    return (
      <span title="Сначала удалите задачи объекта">
        <Button variant="outline" disabled>
          Удалить
        </Button>
      </span>
    )
  }

  return (
    <ConfirmDialog
      trigger={<Button variant="outline">Удалить</Button>}
      title="Удалить объект?"
      description="Объект будет удалён без возможности восстановления."
      confirmLabel="Удалить"
      pending={deleteSite.isPending}
      onConfirm={() =>
        deleteSite.mutate(siteId, {
          onSuccess: () => {
            toast.success('Объект удалён')
            return navigate({ to: '/sites', replace: true })
          },
        })
      }
    />
  )
}
