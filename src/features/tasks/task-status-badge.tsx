import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/features/tasks/api'
import { taskStatusClassName, taskStatusLabel } from '@/features/tasks/status'

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={taskStatusClassName[status]}>{taskStatusLabel[status]}</Badge>
}
