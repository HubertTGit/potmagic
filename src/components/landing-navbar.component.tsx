import { Link, useRouterState } from '@tanstack/react-router';
import { Sun, Moon } from 'lucide-react';
import { useTheme, Theme } from '@/hooks/useTheme';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';

export function LandingNavbar() {
  const { theme, toggle } = useTheme();
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === '/auth';

  return (
    <div className="navbar bg-base-100 px-4 sm:px-6 lg:px-8 py-3">
      <div className="mx-auto w-full max-w-7xl flex items-center">
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={theme === Theme.dark ? 'logo-white.svg' : 'logo-color.svg'}
              alt="potmagic"
              className="h-7"
            />
          </Link>
        </div>
        <div className="navbar-end flex items-center gap-1">
          <a href="#pricing" className="btn btn-ghost btn-sm">
            Pricing
          </a>
          <a href="#concept" className="btn btn-ghost btn-sm">
            Concept
          </a>
          <Link
            to="/auth"
            search={{ token: undefined }}
            className={cn('btn btn-primary btn-sm font-display tracking-wide px-5', isAuthPage && 'btn-active')}
          >
            {session ? 'Manage Theatre' : 'Join Theatre'}
          </Link>

          <Link
            to="/show"
            className="btn btn-sm btn-accent font-display tracking-wide px-5"
          >
            Watch Live
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="btn btn-sm btn-ghost btn-square"
            aria-label="Toggle theme"
          >
            {theme === Theme.dark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
