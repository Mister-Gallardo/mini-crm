import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { useProfile } from '@/features/auth/use-profile'
import { assignedTasksQueryOptions } from '@/features/tasks/api'
import { byAssigneePriority } from '@/features/tasks/status'
import { TaskTable } from '@/features/tasks/task-table'

export const Route = createFileRoute('/_app/my-tasks')({
  beforeLoad: ({ context }) => {
    if (context.profile.role !== 'executor') {
      throw redirect({ to: '/sites' })
    }
  },
  loader: ({ context: { queryClient, profile } }) =>
    queryClient.fetchQuery(assignedTasksQueryOptions(profile.id)),
  component: MyTasksPage,
})

function MyTasksPage() {
  const profile = useProfile()
  const { data: tasks } = useSuspenseQuery({
    ...assignedTasksQueryOptions(profile.id),
    select: (items) => items.toSorted(byAssigneePriority),
  })

  return (
    <>
      <PageHeader title="Мои задачи" description="Сначала задачи, которые ждут ваших действий" />
      {tasks.length > 0 ? (
        <div className="rounded-xl border bg-card">
          <TaskTable tasks={tasks} secondaryColumn="site" />
        </div>
      ) : (
        <EmptyState>Вам пока не назначили задач</EmptyState>
      )}
    </>
  )
}
