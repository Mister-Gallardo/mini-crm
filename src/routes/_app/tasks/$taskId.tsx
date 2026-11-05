import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfile } from '@/features/auth/use-profile'
import {
  taskHistoryQueryOptions,
  taskQueryOptions,
  taskTransitionsQueryOptions,
} from '@/features/tasks/api'
import { DeleteTaskButton } from '@/features/tasks/delete-task-button'
import { TaskActions } from '@/features/tasks/task-actions'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { TaskHistory } from '@/features/tasks/task-history'
import { TaskStatusBadge } from '@/features/tasks/task-status-badge'
import { formatDateTime } from '@/lib/format'
import { ensureFound } from '@/lib/not-found'

export const Route = createFileRoute('/_app/tasks/$taskId')({
  loader: ({ context: { queryClient }, params: { taskId } }) =>
    ensureFound(
      Promise.all([
        queryClient.fetchQuery(taskQueryOptions(taskId)),
        queryClient.fetchQuery(taskHistoryQueryOptions(taskId)),
        queryClient.fetchQuery(taskTransitionsQueryOptions(taskId)),
      ]),
    ),
  component: TaskPage,
})

function TaskPage() {
  const { taskId } = Route.useParams()
  const { data: task } = useSuspenseQuery(taskQueryOptions(taskId))
  const profile = useProfile()
  const isManager = profile.role === 'manager'

  return (
    <>
      <PageHeader
        back={
          <Link
            to="/sites/$siteId"
            params={{ siteId: task.site.id }}
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            ← {task.site.name}
          </Link>
        }
        title={task.title}
        actions={
          isManager && (
            <>
              <TaskFormDialog task={task} trigger={<Button variant="outline">Изменить</Button>} />
              <DeleteTaskButton taskId={task.id} siteId={task.site.id} />
            </>
          )
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Описание</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-sm">
              {task.description || <span className="text-muted-foreground">Без описания</span>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>История</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskHistory taskId={task.id} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Статус</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <TaskStatusBadge status={task.status} />
            <TaskActions taskId={task.id} />
            <dl className="grid gap-3 border-t pt-4 text-sm">
              <TaskDetail term="Объект">{task.site.name}</TaskDetail>
              <TaskDetail term="Исполнитель">{task.assignee.full_name}</TaskDetail>
              <TaskDetail term="Автор">{task.author.full_name}</TaskDetail>
              <TaskDetail term="Создана">{formatDateTime(task.created_at)}</TaskDetail>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function TaskDetail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground">{term}</dt>
      <dd>{children}</dd>
    </div>
  )
}
