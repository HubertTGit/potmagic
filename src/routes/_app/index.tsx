import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '../../lib/auth-client'

export const Route = createFileRoute('/_app/')({
  component: IndexPage,
})

function IndexPage() {
  const { data: session } = authClient.useSession()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
      <p className="text-base-content/60 text-sm">
        {session?.user?.email ?? 'Loading...'}
      </p>
    </div>
  )
}
