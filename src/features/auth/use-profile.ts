import { getRouteApi } from '@tanstack/react-router'

const appRoute = getRouteApi('/_app')

export function useProfile() {
  return appRoute.useRouteContext({ select: (context) => context.profile })
}
