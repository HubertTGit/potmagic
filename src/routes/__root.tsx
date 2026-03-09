import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useTheme } from '../hooks/useTheme'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <header className="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300">
        <span className="font-semibold text-sm">honeypotmagic</span>
        <button
          onClick={toggle}
          className="px-3 py-1 rounded text-sm bg-base-300 hover:bg-neutral transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </header>
      <Outlet />
    </div>
  )
}
