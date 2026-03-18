import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { DirectorLogin } from '@/components/director-login.component';
import { ActorLogin } from '@/components/actor-login.component';
import { LandingNavbar } from '@/components/landing-navbar.component';
import { LandingFooter } from '@/components/landing-footer.component';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [{ title: 'Sign In — potmagic' }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' && search.token ? search.token : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) {
      navigate({ to: '/stories' });
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <LandingNavbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-0">
          <DirectorLogin token={token} />
          <div className="flex md:flex-col items-center gap-3 md:px-8">
            <div className="flex-1 h-px md:h-16 md:w-px w-16 bg-base-content/10" />
            <span className="text-2xl text-base-content/30">or</span>
            <div className="flex-1 h-px md:h-16 md:w-px w-16 bg-base-content/10" />
          </div>
          <ActorLogin />
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
