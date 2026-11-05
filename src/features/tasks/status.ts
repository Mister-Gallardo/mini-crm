import type { TaskStatus } from '@/features/tasks/api'

export const taskStatusLabel: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  in_review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
}

export const taskStatusClassName: Record<TaskStatus, string> = {
  new: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  in_progress: 'border-sky-200 bg-sky-50 text-sky-800',
  in_review: 'border-amber-200 bg-amber-50 text-amber-800',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rework: 'border-rose-200 bg-rose-50 text-rose-800',
}

const transitionLabel: Partial<Record<TaskStatus, string>> = {
  in_progress: 'Взять в работу',
  in_review: 'Отправить на проверку',
  accepted: 'Принять',
  rework: 'Вернуть на доработку',
}

export function getTransitionLabel(status: TaskStatus) {
  return transitionLabel[status] ?? taskStatusLabel[status]
}

const assigneePriority: Record<TaskStatus, number> = {
  rework: 0,
  new: 1,
  in_progress: 2,
  in_review: 3,
  accepted: 4,
}

export function byAssigneePriority(a: { status: TaskStatus }, b: { status: TaskStatus }) {
  return assigneePriority[a.status] - assigneePriority[b.status]
}
