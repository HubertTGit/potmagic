import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { StageComponent } from '../components/stage.component'
import bearPng from '../assets/bear.png'
import crocodilePng from '../assets/crocodile.png'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stage',
  component: StagePage,
})

function StagePage() {
  return <StageComponent images={[bearPng, crocodilePng]} />
}
