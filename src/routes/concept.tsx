import { createFileRoute } from '@tanstack/react-router';
import { LandingNavbar } from '@/components/landing-navbar.component';

export const Route = createFileRoute('/concept')({
  head: () => ({ meta: [{ title: 'Concept — potmagic' }] }),
  component: ConceptPage,
});

function ConceptPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      <LandingNavbar />
    </div>
  );
}
