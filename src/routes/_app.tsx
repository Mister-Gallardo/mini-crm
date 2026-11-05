import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { getSessionUserId, profileQueryOptions, signOut } from '@/features/auth/api'
import type { Enums } from '@/lib/database.types'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    const userId = await getSessionUserId()

    if (!userId) {
      throw redirect({ to: '/login' })
    }

    const profile = await context.queryClient.ensureQueryData(profileQueryOptions(userId))
    return { profile }
  },
  component: AppLayout,
})

const roleLabel: Record<Enums<'user_role'>, string> = {
  manager: 'Постановщик',
  executor: 'Исполнитель',
}

const navLinkProps = {
  className: 'transition-colors hover:text-foreground',
  activeProps: { className: 'font-medium text-foreground' },
  inactiveProps: { className: 'text-muted-foreground' },
}

function AppLayout() {
  const { profile } = Route.useRouteContext()

  return (
    <div className="min-h-svh">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="font-semibold">
            Объекты и задачи
          </Link>
          <nav className="flex gap-4 text-sm">
            {profile.role === 'executor' && (
              <Link to="/my-tasks" {...navLinkProps}>
                Мои задачи
              </Link>
            )}
            <Link to="/sites" {...navLinkProps}>
              Объекты
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-right sm:grid">
              <span className="font-medium">{profile.full_name}</span>
              <span className="text-muted-foreground text-xs">{roleLabel[profile.role]}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Выйти
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
