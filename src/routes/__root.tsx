import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import appCss from '@/index.css?url'
import { toast } from '@/lib/toast'
import { Toaster } from '@/components/toaster.component'

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(errorMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(errorMessage(error)),
  }),
})

function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-base-content/60">Page not found</p>
    </div>
  )
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'potmagic' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/vite.svg' },
    ],
    scripts: [
      {
        children: `document.documentElement.setAttribute('data-theme',
          localStorage.getItem('theme') || 'potmagic-dark');`,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  )
}
