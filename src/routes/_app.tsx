import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Sidebar } from '@/components/sidebar.component';
import { requireAuth } from '@/lib/auth-guard';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => requireAuth(),
  component: AppLayout,
});

function AppLayout() {
  const { data: session } = authClient.useSession();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen bg-base-100 text-base-content">
        {/* Mobile header */}
        <div className="navbar bg-base-200 border-b border-base-300 lg:hidden px-2 min-h-[52px]">
          <label htmlFor="app-drawer" className="btn btn-square btn-ghost btn-sm">
            <Menu className="size-5" />
          </label>
          <Link
            to="/"
            className="font-display italic font-semibold text-primary text-lg leading-none ml-2 select-none"
          >
            potmagic
          </Link>
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <Sidebar />
      </div>
    </div>
  );
}
