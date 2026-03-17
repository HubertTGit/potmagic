import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { actorSignIn } from '@/lib/actor-auth.fns';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';

export default function ActorLogin() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // refetch() updates the shared useSession() atom — getSession() does not
  const { refetch } = authClient.useSession();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await actorSignIn({ data: { email: form.get('email') as string } });
      // Hydrate the shared session atom so _app.tsx sees a non-null session
      await refetch();
      await router.navigate({ to: '/stories' });
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 rounded-box overflow-hidden border border-primary/25 w-full min-w-[350px] mx-4 h-full">
      <div className="card-body gap-0 p-0">
        <div className="px-8 pt-4 pb-6 text-center">
          <h1
            className={cn(
              'card-title justify-center font-display italic font-semibold text-2xl leading-none mb-2 text-secondary tracking-[-0.01em]',
            )}
          >
            I am an Actor
          </h1>
          <p className="font-display text-sm tracking-[0.25em] uppercase text-base-content/40">
            Enter the stage
          </p>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-error text-xs text-center">{error}</p>}

            <fieldset className="fieldset gap-1">
              <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
                Email
              </legend>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="input w-full"
              />
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'btn btn-primary btn-block mt-1 font-display text-base tracking-[0.08em]',
                loading && 'opacity-60 cursor-not-allowed',
              )}
            >
              {loading ? 'Entering…' : 'Enter →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
