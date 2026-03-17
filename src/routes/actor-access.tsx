import { createFileRoute } from '@tanstack/react-router'
import ActorLogin from '@/components/actor-login.component'

export const Route = createFileRoute('/actor-access')({
  component: ActorAccessPage,
})

function ActorAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <ActorLogin />
    </div>
  )
}
