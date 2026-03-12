import { createMiddleware } from '@tanstack/react-start'
import { auth } from '@/lib/auth'

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url)
  const { pathname } = url

  // Skip middleware for non-page requests
  if (pathname.startsWith('/api') || pathname.startsWith('/_server')) {
    return next()
  }

  const session = await auth.api.getSession({ headers: request.headers })

  if (pathname.startsWith('/stage') && !session) {
    throw new Response(null, { status: 302, headers: { Location: '/auth' } })
  }

  if (pathname === '/auth' && session) {
    throw new Response(null, { status: 302, headers: { Location: '/stories' } })
  }

  if (pathname === '/' && session) {
    throw new Response(null, { status: 302, headers: { Location: '/stories' } })
  }

  return next()
})
