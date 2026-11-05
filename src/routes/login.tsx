import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionUserId } from '@/features/auth/api'
import { LoginForm } from '@/features/auth/login-form'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (await getSessionUserId()) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <LoginForm />
    </main>
  )
}
