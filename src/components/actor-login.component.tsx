import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { actorSignIn } from '@/lib/actor-auth.fns';
import ActorLoginForm from '@/components/actor-login-form.component';

export default function ActorLogin() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleActorLogin = async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      await actorSignIn({ data: { email } });
      await router.navigate({ to: '/stories' });
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 pb-8">
      <ActorLoginForm loading={loading} error={error} onSubmit={handleActorLogin} />
    </div>
  );
}
