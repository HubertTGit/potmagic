import { useState } from 'react';
import { Star } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { actorSignIn } from '@/lib/actor-auth.fns';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';

export function ActorLogin() {
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
    <div className="card bg-base-100 rounded-box overflow-hidden border border-secondary/60 w-full min-w-87.5 mx-4 h-full ring-2 ring-transparent hover:ring-secondary transition-all duration-300">
      <div className="card-body gap-0 p-0">
        {/* Role icon header */}
        <div className="flex flex-col items-center px-8 pt-8 pb-6">
          <div className="size-20 flex items-center justify-center">
            <Star className="size-10 text-secondary" />
          </div>
          <h2 className="card-title justify-center font-display italic font-semibold text-2xl leading-none mb-1 text-secondary tracking-[-0.01em]">
            I am an Actor
          </h2>
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
                'btn btn-secondary btn-block mt-1 font-display text-base tracking-[0.08em]',
                loading && 'opacity-60 cursor-not-allowed',
              )}
            >
              {loading ? 'Entering…' : 'Enter →'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-base-content/30 text-sm">
              Ready to showcase your talent?
              <br />
              <span className="text-secondary/70">Your next role awaits!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
