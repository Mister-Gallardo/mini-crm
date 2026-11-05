import { MutationCache, QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ErrorScreen, NotFoundScreen, PendingScreen } from '@/components/route-states'
import { getErrorMessage, isNetworkError } from '@/lib/errors'
import { routeTree } from '@/routeTree.gen'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 2 && isNetworkError(error),
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  }),
})

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: PendingScreen,
  defaultErrorComponent: ErrorScreen,
  defaultNotFoundComponent: NotFoundScreen,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
