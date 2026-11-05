import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'

export type SiteInput = { name: string; address: string }

async function fetchSites() {
  const { data } = await supabase
    .from('sites')
    .select('id, name, address, tasks(count)')
    .order('name')
    .throwOnError()

  return data.map(({ tasks, ...site }) => ({ ...site, taskCount: tasks[0]?.count ?? 0 }))
}

async function fetchSite(siteId: string) {
  const { data } = await supabase
    .from('sites')
    .select('id, name, address')
    .eq('id', siteId)
    .single()
    .throwOnError()

  return data
}

export type SiteListItem = Awaited<ReturnType<typeof fetchSites>>[number]
export type Site = Awaited<ReturnType<typeof fetchSite>>

export const sitesQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.sites.list, queryFn: fetchSites })

export const siteQueryOptions = (siteId: string) =>
  queryOptions({ queryKey: queryKeys.sites.detail(siteId), queryFn: () => fetchSite(siteId) })

export function useSaveSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ siteId, values }: { siteId?: string; values: SiteInput }) => {
      if (siteId) {
        await supabase.from('sites').update(values).eq('id', siteId).throwOnError()
        return siteId
      }

      const { data } = await supabase
        .from('sites')
        .insert(values)
        .select('id')
        .single()
        .throwOnError()

      return data.id
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
      ]),
  })
}

export function useDeleteSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (siteId: string) => {
      await supabase.from('sites').delete().eq('id', siteId).throwOnError()
    },
    onSuccess: (_, siteId) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sites.detail(siteId),
          refetchType: 'none',
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sites.list }),
      ]),
  })
}
