import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { StageComponent } from '../components/stage.component'
import bearPng from '../assets/bear.png'
import crocodilePng from '../assets/crocodile.png'
import { auth } from '../lib/auth'

const requireAuth = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw redirect({ to: '/login' })
})

export const Route = createFileRoute('/stage')({
  beforeLoad: () => requireAuth(),
  component: StagePage,
})

function StagePage() {
  return <StageComponent images={[bearPng, crocodilePng]} />
}
