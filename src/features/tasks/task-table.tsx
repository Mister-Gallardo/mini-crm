import { Link } from '@tanstack/react-router'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TaskListItem } from '@/features/tasks/api'
import { TaskStatusBadge } from '@/features/tasks/task-status-badge'
import { formatDate } from '@/lib/format'

type TaskTableProps = {
  tasks: TaskListItem[]
  secondaryColumn: 'site' | 'assignee'
}

export function TaskTable({ tasks, secondaryColumn }: TaskTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Задача</TableHead>
          <TableHead>{secondaryColumn === 'site' ? 'Объект' : 'Исполнитель'}</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead className="text-right">Создана</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <Link
                to="/tasks/$taskId"
                params={{ taskId: task.id }}
                className="font-medium underline-offset-4 hover:underline"
              >
                {task.title}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {secondaryColumn === 'site' ? task.site.name : task.assignee.full_name}
            </TableCell>
            <TableCell>
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-right text-muted-foreground">
              {formatDate(task.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
