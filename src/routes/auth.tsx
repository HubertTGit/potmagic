import { createFileRoute, Link } from '@tanstack/react-router';
import { DirectorLogin } from '@/components/director-login.component';
import { ActorLogin } from '@/components/actor-login.component';
import { HomeIcon } from '@heroicons/react/24/outline';

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' && search.token ? search.token : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { token } = Route.useSearch();
  return (
    <div className="min-h-screen flex items-center flex-col justify-center bg-base-200 px-4 gap-10">
      <Link to="/" className="fixed top-4 left-4 btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-base-content">
        <HomeIcon className="size-4" />
        Home
      </Link>
      <div className="text-center flex flex-col gap-10">
        <h1 className="font-display italic font-semibold text-7xl text-primary leading-none">
          potmagic
        </h1>
        <p className="text-base-content/40 text-base mt-2 max-w-96">
          Step into the digital spotlight. Join our online community theater and
          perform live from anywhere.
        </p>
      </div>
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
  );
}
