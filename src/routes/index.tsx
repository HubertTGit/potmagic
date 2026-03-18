import { createFileRoute } from '@tanstack/react-router';
import { LandingNavbar } from '@/components/landing-navbar.component';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'potmagic' }] }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <LandingNavbar />
    </div>
  );
}
