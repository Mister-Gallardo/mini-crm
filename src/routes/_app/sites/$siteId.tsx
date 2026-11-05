import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/features/auth/use-profile'
import { siteQueryOptions } from '@/features/sites/api'
import { DeleteSiteButton } from '@/features/sites/delete-site-button'
import { SiteFormDialog } from '@/features/sites/site-form-dialog'
import { siteTasksQueryOptions } from '@/features/tasks/api'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { TaskTable } from '@/features/tasks/task-table'
import { ensureFound } from '@/lib/not-found'

export const Route = createFileRoute('/_app/sites/$siteId')({
  loader: ({ context: { queryClient }, params: { siteId } }) =>
    ensureFound(
      Promise.all([
        queryClient.fetchQuery(siteQueryOptions(siteId)),
        queryClient.fetchQuery(siteTasksQueryOptions(siteId)),
      ]),
    ),
  component: SitePage,
})

function SitePage() {
  const { siteId } = Route.useParams()
  const { data: site } = useSuspenseQuery(siteQueryOptions(siteId))
  const { data: tasks } = useSuspenseQuery(siteTasksQueryOptions(siteId))
  const profile = useProfile()
  const isManager = profile.role === 'manager'

  return (
    <>
      <PageHeader
        back={
          <Link to="/sites" className="text-muted-foreground text-sm hover:text-foreground">
            ← Все объекты
          </Link>
        }
        title={site.name}
        description={site.address}
        actions={
          isManager && (
            <>
              <SiteFormDialog site={site} trigger={<Button variant="outline">Изменить</Button>} />
              <DeleteSiteButton siteId={site.id} hasTasks={tasks.length > 0} />
              <TaskFormDialog siteId={site.id} trigger={<Button>Новая задача</Button>} />
            </>
          )
        }
      />
      <section className="grid gap-3">
        <h2 className="font-semibold text-lg">Задачи</h2>
        {tasks.length > 0 ? (
          <div className="rounded-xl border bg-card">
            <TaskTable tasks={tasks} secondaryColumn="assignee" />
          </div>
        ) : (
          <EmptyState>Задач по объекту пока нет</EmptyState>
        )}
      </section>
    </>
  )
}
