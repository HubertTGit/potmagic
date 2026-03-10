import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { useTheme } from '../hooks/useTheme'
import type { ReactNode } from 'react'
import appCss from '../index.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'honeypotmagic' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/vite.svg' },
    ],
    scripts: [
      {
        children: `document.documentElement.setAttribute('data-theme',
          localStorage.theme === 'dark' ||
          (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'dark' : 'light');`,
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
  return <Outlet />
}
