import { useSuspenseQuery } from '@tanstack/react-query'
import { taskHistoryQueryOptions } from '@/features/tasks/api'
import { TaskStatusBadge } from '@/features/tasks/task-status-badge'
import { formatDateTime } from '@/lib/format'

export function TaskHistory({ taskId }: { taskId: string }) {
  const { data: history } = useSuspenseQuery(taskHistoryQueryOptions(taskId))

  return (
    <ol className="grid gap-5">
      {history.map((entry) => (
        <li key={entry.id} className="grid gap-1.5 border-l-2 pl-4">
          <div className="flex flex-wrap items-center gap-2">
            {entry.from_status ? (
              <>
                <TaskStatusBadge status={entry.from_status} />
                <span aria-hidden className="text-muted-foreground">
                  →
                </span>
              </>
            ) : (
              <span className="text-sm">Создана со статусом</span>
            )}
            <TaskStatusBadge status={entry.to_status} />
          </div>
          <p className="text-muted-foreground text-sm">
            {entry.actor.full_name} · {formatDateTime(entry.changed_at)}
          </p>
          {entry.comment && (
            <p className="whitespace-pre-line rounded-md bg-muted px-3 py-2 text-sm">
              {entry.comment}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
