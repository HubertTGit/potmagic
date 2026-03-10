import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '../lib/auth'
import { Sidebar } from '../components/sidebar.component'

const requireAuth = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw redirect({ to: '/login' })
})

export const Route = createFileRoute('/_app')({
  beforeLoad: () => requireAuth(),
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
