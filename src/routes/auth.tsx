import { createFileRoute } from '@tanstack/react-router';
import DirectorLogin from '@/components/director-login.component';

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: LoginPage,
});

function LoginPage() {
  const { token } = Route.useSearch();
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <DirectorLogin token={token} />
    </div>
  );
}
