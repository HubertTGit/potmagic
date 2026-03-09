import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as stageRoute } from './routes/stage'
import { Route as loginRoute } from './routes/login'

const routeTree = rootRoute.addChildren([indexRoute, stageRoute, loginRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
