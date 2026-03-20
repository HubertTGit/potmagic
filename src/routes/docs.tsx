import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router';
import { LandingNavbar } from '@/components/landing-navbar.component';
import { LandingFooter } from '@/components/landing-footer.component';
import { BookOpen, FilePlus, Layers, Library, Ruler } from 'lucide-react';

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
  notFoundComponent: () => <Navigate to="/docs" />,
});

const NAV_ITEMS = [
  { to: '/docs' as const, label: 'Overview', icon: BookOpen, exact: true },
  { to: '/docs/create-story' as const, label: 'Create a Story', icon: FilePlus, exact: false },
  { to: '/docs/add-scenes' as const, label: 'Add Scenes', icon: Layers, exact: false },
  { to: '/docs/props' as const, label: 'Props Library', icon: Library, exact: false },
  { to: '/docs/size-guidelines' as const, label: 'Size Guidelines', icon: Ruler, exact: false },
];

function DocsLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-base-200 text-base-content">
      <LandingNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
          <div className="flex gap-10">

            {/* Sidebar */}
            <aside className="w-48 shrink-0">
              <p className="text-base-content/40 mb-3 text-[11px] font-semibold uppercase tracking-widest">
                Documentation
              </p>
              <nav className="flex flex-col gap-0.5">
                {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact }}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-base-content/60 transition-colors hover:bg-base-300 hover:text-base-content [&.active]:bg-primary/10 [&.active]:font-medium [&.active]:text-primary"
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* Vertical separator */}
            <div className="border-l border-base-300 self-stretch" />

            {/* Main content */}
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>

          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
