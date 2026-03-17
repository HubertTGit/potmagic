import { createFileRoute, Outlet } from '@tanstack/react-router';
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
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
