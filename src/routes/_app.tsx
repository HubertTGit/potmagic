import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Sidebar } from '@/components/sidebar.component';
import { requireAuth } from '@/lib/auth-guard';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => requireAuth(),
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
