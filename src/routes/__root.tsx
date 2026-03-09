import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useTheme } from '../hooks/useTheme';
import {
  SunIcon,
  MoonIcon,
  FilmIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { theme, toggle } = useTheme();

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
            <Link
              to="/login"
              className="hover:text-base-content transition-colors [&.active]:text-base-content flex gap-2 items-center"
              aria-label="Login"
            >
              <span>Login</span>
              <LockClosedIcon className="size-5" />
            </Link>
          </nav>
        </div>
        <button
          onClick={toggle}
          className="p-1.5 rounded text-base-content/60 hover:text-base-content bg-base-300 hover:bg-neutral transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <SunIcon className="size-5" />
          ) : (
            <MoonIcon className="size-5" />
          )}
        </button>
      </header>
      <Outlet />
    </div>
  );
}
