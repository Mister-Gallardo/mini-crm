import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from '@/lib/supabase'
import { queryClient, router } from '@/router'
import './index.css'

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    router.navigate({ to: '/login' }).then(() => queryClient.clear())
  }
})

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element is missing')
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
