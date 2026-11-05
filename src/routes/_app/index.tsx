import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: context.profile.role === 'manager' ? '/sites' : '/my-tasks' })
  },
})
