import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import { useTheme } from '../hooks/useTheme'
import { SunIcon, MoonIcon, FilmIcon, LockClosedIcon, ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import appCss from '../index.css?url'
import { authClient } from '../lib/auth-client'

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
  const { theme, toggle } = useTheme()
  const { data: session } = authClient.useSession()

  return (
    <div className="min-h-screen flex flex-col bg-base-100 text-base-content">
      <header className="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm">honeypotmagic</span>
          <nav className="flex items-center gap-3 text-base-content/60">
            <Link
              to="/stage"
              className="hover:text-base-content transition-colors [&.active]:text-base-content flex gap-2 items-center"
              aria-label="Stage"
            >
              <span>Stage</span>
              <FilmIcon className="size-5" />
            </Link>
            {session ? (
              <button
                onClick={() => authClient.signOut()}
                className="hover:text-base-content transition-colors flex gap-2 items-center"
                aria-label="Logout"
              >
                <span>Logout</span>
                <ArrowRightEndOnRectangleIcon className="size-5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="hover:text-base-content transition-colors [&.active]:text-base-content flex gap-2 items-center"
                aria-label="Login"
              >
                <span>Login</span>
                <LockClosedIcon className="size-5" />
              </Link>
            )}
          </nav>
        </div>
        <button
          onClick={toggle}
          className="p-1.5 rounded text-base-content/60 hover:text-base-content bg-base-300 hover:bg-neutral transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
        </button>
      </header>
      <Outlet />
    </div>
  )
}
