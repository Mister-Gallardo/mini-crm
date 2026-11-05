import { queryOptions } from '@tanstack/react-query'
import type { Tables } from '@/lib/database.types'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'

export type Profile = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'role'>

export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.profile(userId),
    queryFn: async (): Promise<Profile> => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .single()
        .throwOnError()

      return data
    },
    staleTime: Number.POSITIVE_INFINITY,
  })

export async function getSessionUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw error
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}
