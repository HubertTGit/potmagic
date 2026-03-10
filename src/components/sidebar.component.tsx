import { Link, useRouter } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../lib/cn'
import {
  BookOpenIcon,
  FilmIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline'

export function Sidebar() {
  const { data: session } = authClient.useSession()
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const isDirector = session?.user?.role === 'director'

  const handleLogout = async () => {
    await authClient.signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <aside className="w-52 shrink-0 flex flex-col bg-base-200 border-r border-base-300 min-h-screen">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-base-300">
        {/* Stylistic truncation matching the login page brand — intentional */}
        <span className="font-display italic font-semibold text-gold text-lg leading-none">
          potmagic
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        <SidebarLink to="/stories/" icon={<BookOpenIcon className="size-4" />}>
          Stories
        </SidebarLink>
        {/* /stage is a flat route (no storyId param at this point in the codebase) */}
        <SidebarLink to="/stage" icon={<FilmIcon className="size-4" />}>
          Stage
        </SidebarLink>
        {isDirector && (
          <SidebarLink to="/director" icon={<Cog6ToothIcon className="size-4" />}>
            Director
          </SidebarLink>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-base-300 flex flex-col gap-1">
        <SidebarLink to="/profile" icon={<UserCircleIcon className="size-4" />}>
          Profile
        </SidebarLink>
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-base-content hover:bg-base-300 transition-colors w-full text-left"
        >
          {theme === 'dark' ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {session && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-error hover:bg-base-300 transition-colors w-full text-left"
          >
            <ArrowRightEndOnRectangleIcon className="size-4" />
            Logout
          </button>
        )}
      </div>
    </aside>
  )
}

function SidebarLink({
  to,
  icon,
  children,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-base-content/60',
        'hover:text-base-content hover:bg-base-300 transition-colors',
        '[&.active]:text-base-content [&.active]:bg-base-300 [&.active]:border-l-2 [&.active]:border-gold [&.active]:pl-2.5',
      )}
    >
      {icon}
      {children}
    </Link>
  )
}
