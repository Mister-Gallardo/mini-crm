import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/features/auth/use-profile'
import { sitesQueryOptions } from '@/features/sites/api'
import { SiteFormDialog } from '@/features/sites/site-form-dialog'
import { SiteList } from '@/features/sites/site-list'

export const Route = createFileRoute('/_app/sites/')({
  loader: ({ context }) => context.queryClient.fetchQuery(sitesQueryOptions()),
  component: SitesPage,
})

function SitesPage() {
  const { data: sites } = useSuspenseQuery(sitesQueryOptions())
  const profile = useProfile()
  const isManager = profile.role === 'manager'

  return (
    <>
      <PageHeader
        title="Объекты"
        description={isManager ? 'Все стройки компании' : 'Стройки, где у вас есть задачи'}
        actions={isManager && <SiteFormDialog trigger={<Button>Добавить объект</Button>} />}
      />
      {sites.length > 0 ? (
        <SiteList sites={sites} />
      ) : (
        <EmptyState>{isManager ? 'Объектов пока нет' : 'Вам пока не назначили задач'}</EmptyState>
      )}
    </>
  )
}
