import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useTheme, Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import {
  BookOpenIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowRightEndOnRectangleIcon,
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

  const handleLogout = async () => {
    await authClient.signOut();
    router.navigate({ to: '/login' });
  };

  return (
    <aside
      className={cn(
        'shrink-0 flex flex-col bg-base-200 border-r border-base-300 min-h-screen transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-14' : 'w-52',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center border-b border-base-300 h-[52px]',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <span className="font-display italic font-semibold text-gold text-lg leading-none select-none">
          {collapsed ? 'p' : 'potmagic'}
        </span>
        <button
          onClick={handleCollapseToggle}
          className={cn(
            'ml-auto flex items-center justify-center size-6 rounded text-base-content/30 hover:text-base-content/70 hover:bg-base-300 transition-colors shrink-0',
            collapsed && 'ml-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
          icon={<BookOpenIcon className="size-4" />}
          collapsed={collapsed}
        >
          Stories
        </SidebarLink>
        {isDirector && (
          <SidebarLink
            to="/director"
            icon={<Cog6ToothIcon className="size-4" />}
            collapsed={collapsed}
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
        >
          Profile
        </SidebarLink>
        <button
          onClick={toggle}
          title={theme === Theme.light ? 'Light mode' : 'Dark mode'}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-base-content hover:bg-base-300 transition-colors w-full',
            collapsed ? 'justify-center px-0' : 'text-left',
          )}
        >
          {theme === 'dracula' ? (
            <SunIcon className="size-4 shrink-0" />
          ) : (
            <MoonIcon className="size-4 shrink-0" />
          )}
          {!collapsed && (theme === 'dracula' ? 'Light mode' : 'Dark mode')}
        </button>
        {session && (
          <button
            onClick={handleLogout}
            title="Logout"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-error hover:bg-base-300 transition-colors w-full',
              collapsed ? 'justify-center px-0' : 'text-left',
            )}
          >
            <ArrowRightEndOnRectangleIcon className="size-4 shrink-0" />
            {!collapsed && 'Logout'}
          </button>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  icon,
  collapsed,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? String(children) : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60',
        'hover:text-base-content hover:bg-base-300 transition-colors',
        '[&.active]:text-base-content [&.active]:bg-base-300 [&.active]:border-l-2 [&.active]:border-gold [&.active]:pl-2.5',
        collapsed &&
          'justify-center px-0 [&.active]:border-l-0 [&.active]:pl-0',
      )}
    >
      {icon}
      {!collapsed && children}
    </Link>
  );
}
