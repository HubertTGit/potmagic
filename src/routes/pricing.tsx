import { createFileRoute } from '@tanstack/react-router';
import { LandingNavbar } from '@/components/landing-navbar.component';

export const Route = createFileRoute('/pricing')({
  head: () => ({ meta: [{ title: 'Pricing — potmagic' }] }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <LandingNavbar />
    </div>
  );
}
