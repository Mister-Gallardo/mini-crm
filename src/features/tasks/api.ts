import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Enums } from '@/lib/database.types'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'

export type TaskStatus = Enums<'task_status'>

export type TaskInput = {
  title: string
  description: string
  site_id: string
  assignee_id: string
}

const taskListColumns =
  'id, title, status, created_at, site:sites(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name)'

async function fetchTasks(column: 'site_id' | 'assignee_id', value: string) {
  const { data } = await supabase
    .from('tasks')
    .select(taskListColumns)
    .eq(column, value)
    .order('created_at', { ascending: false })
    .throwOnError()

  return data
}

async function fetchTask(taskId: string) {
  const { data } = await supabase
    .from('tasks')
    .select(
      'id, title, description, status, created_at, site:sites(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name), author:profiles!tasks_author_id_fkey(id, full_name)',
    )
    .eq('id', taskId)
    .single()
    .throwOnError()

  return data
}

async function fetchTaskHistory(taskId: string) {
  const { data } = await supabase
    .from('task_status_history')
    .select('id, from_status, to_status, comment, changed_at, actor:profiles(id, full_name)')
    .eq('task_id', taskId)
    .order('id', { ascending: false })
    .throwOnError()

  return data
}

async function fetchTaskTransitions(taskId: string) {
  const { data } = await supabase.rpc('get_task_transitions', { task_id: taskId }).throwOnError()
  return data
}

async function fetchExecutors() {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'executor')
    .order('full_name')
    .throwOnError()

  return data
}

export type TaskListItem = Awaited<ReturnType<typeof fetchTasks>>[number]
export type TaskDetails = Awaited<ReturnType<typeof fetchTask>>
export type TaskHistoryEntry = Awaited<ReturnType<typeof fetchTaskHistory>>[number]

export const siteTasksQueryOptions = (siteId: string) =>
  queryOptions({
    queryKey: queryKeys.tasks.bySite(siteId),
    queryFn: () => fetchTasks('site_id', siteId),
  })

export const assignedTasksQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.tasks.assigned(userId),
    queryFn: () => fetchTasks('assignee_id', userId),
  })

export const taskQueryOptions = (taskId: string) =>
  queryOptions({ queryKey: queryKeys.tasks.detail(taskId), queryFn: () => fetchTask(taskId) })

export const taskHistoryQueryOptions = (taskId: string) =>
  queryOptions({
    queryKey: queryKeys.tasks.history(taskId),
    queryFn: () => fetchTaskHistory(taskId),
  })

export const taskTransitionsQueryOptions = (taskId: string) =>
  queryOptions({
    queryKey: queryKeys.tasks.transitions(taskId),
    queryFn: () => fetchTaskTransitions(taskId),
  })

export const executorsQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.executors, queryFn: fetchExecutors, staleTime: 5 * 60_000 })

export function useSaveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, values }: { taskId?: string; values: TaskInput }) => {
      if (taskId) {
        await supabase.from('tasks').update(values).eq('id', taskId).throwOnError()
        return taskId
      }

      const { data } = await supabase
        .from('tasks')
        .insert(values)
        .select('id')
        .single()
        .throwOnError()

      return data.id
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all }),
      ]),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      await supabase.from('tasks').delete().eq('id', taskId).throwOnError()
    },
    onSuccess: (_, taskId) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.detail(taskId),
          refetchType: 'none',
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.list }),
      ]),
  })
}

export function useChangeTaskStatus(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ nextStatus, comment }: { nextStatus: TaskStatus; comment?: string }) => {
      await supabase
        .rpc('change_task_status', { task_id: taskId, next_status: nextStatus, comment })
        .throwOnError()
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists }),
      ]),
  })
}
