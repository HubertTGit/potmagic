import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useTheme, Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import {
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowRightEndOnRectangleIcon,
  AcademicCapIcon,
  Square3Stack3DIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export function Sidebar() {
  const { data: session } = authClient.useSession();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const isDirector = session?.user?.role === 'director';
  const location = useRouterState({ select: (s) => s.location.pathname });
  const isStage = location.startsWith('/stage/');

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStage) setCollapsed(true);
  }, [isStage]);

  const handleCollapseToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (!isStage) {
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch {}
    }
  };

  const expandOnDesktop = () => {
    if (collapsed && window.matchMedia('(min-width: 1024px)').matches) {
      setCollapsed(false);
      if (!isStage) {
        try {
          localStorage.setItem('sidebar-collapsed', 'false');
        } catch {}
      }
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.navigate({ to: '/auth', search: { token: '' } });
  };

  const btnBase = cn(
    'btn btn-ghost btn-sm font-normal text-base-content/60',
    collapsed ? 'btn-square' : 'w-full justify-start gap-3',
  );

  return (
    <aside
      className={cn(
        'flex flex-col bg-base-200 border-r border-base-300 min-h-full transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-52',
      )}
    >
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          'flex items-center border-b border-base-300 h-13',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        {!collapsed && (
          <Link
            to="/"
            className="font-display italic font-semibold text-primary text-lg leading-none select-none hover:opacity-75 transition-opacity"
          >
            potmagic
          </Link>
        )}
        <button
          onClick={handleCollapseToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'btn btn-ghost btn-xs btn-square text-base-content/30',
            collapsed ? '' : 'ml-auto',
          )}
        >
          {collapsed ? (
            <ChevronRightIcon className="size-3.5" />
          ) : (
            <ChevronLeftIcon className="size-3.5" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        <SidebarLink
          to="/stories/"
          icon={<Square3Stack3DIcon className="size-4" />}
          collapsed={collapsed}
          onExpand={expandOnDesktop}
        >
          Stories
        </SidebarLink>
        {isDirector && (
          <SidebarLink
            to="/director"
            icon={<AcademicCapIcon className="size-4" />}
            collapsed={collapsed}
            onExpand={expandOnDesktop}
          >
            Director
          </SidebarLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-base-300 flex flex-col gap-1">
        <SidebarLink
          to="/profile"
          icon={<UserCircleIcon className="size-4" />}
          collapsed={collapsed}
          onExpand={expandOnDesktop}
        >
          Profile
        </SidebarLink>

        <div
          className={cn(collapsed && 'tooltip tooltip-right')}
          data-tip={collapsed ? (theme === Theme.dark ? 'Light mode' : 'Dark mode') : undefined}
        >
          <button onClick={toggle} className={btnBase}>
            {theme === Theme.dark ? (
              <SunIcon className="size-4 shrink-0" />
            ) : (
              <MoonIcon className="size-4 shrink-0" />
            )}
            {!collapsed && (theme === Theme.dark ? 'Light mode' : 'Dark mode')}
          </button>
        </div>

        {session && (
          <div
            className={cn(collapsed && 'tooltip tooltip-right')}
            data-tip={collapsed ? 'Logout' : undefined}
          >
            <button onClick={handleLogout} className={cn(btnBase, 'hover:text-error hover:btn-error')}>
              <ArrowRightEndOnRectangleIcon className="size-4 shrink-0" />
              {!collapsed && 'Logout'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  icon,
  collapsed,
  onExpand,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  collapsed: boolean;
  onExpand?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(collapsed && 'tooltip tooltip-right')}
      data-tip={collapsed ? String(children) : undefined}
    >
      <Link
        to={to}
        onClick={onExpand}
        className={cn(
          'btn btn-ghost btn-sm font-normal text-base-content/60',
          collapsed ? 'btn-square' : 'w-full justify-start gap-3',
          '[&.active]:bg-primary/10 [&.active]:text-primary',
        )}
      >
        {icon}
        {!collapsed && children}
      </Link>
    </div>
  );
}
