import { createFileRoute } from '@tanstack/react-router';
import { authClient } from '../lib/auth-client';

type Session = typeof authClient.$Infer.Session;

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  const { data: session } = authClient.useSession();
  return <IndexPage session={session} />;
}

function IndexPage({ session: _session }: { session: Session | null }) {
  return (
    <main>
      <h1>Hello World</h1>
    </main>
  );
}
