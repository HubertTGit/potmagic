import { createFileRoute } from '@tanstack/react-router';
import DirectorLogin from '@/components/director-login.component';
import ActorLogin from '@/components/actor-login.component';

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: LoginPage,
});

function LoginPage() {
  const { token } = Route.useSearch();
  return (
    <div className="min-h-screen flex items-center flex-col justify-center bg-base-200 px-4 gap-6">
      <h1 className="justify-center font-display italic font-semibold text-7xl text-secondary">
        potmagic
      </h1>
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
