import { useState, useRef, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import PasswordInput from '@/components/password-input.component';
import { cn } from '@/lib/cn';

type DirectorView = 'login' | 'register' | 'forgot';

export default function DirectorLogin() {
  const [view, setView] = useState<DirectorView>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastEmail, setToastEmail] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const switchView = (next: DirectorView) => {
    setView(next);
    setError(null);
    setResetSent(false);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? 'Sign in failed');
      return;
    }
    await router.navigate({ to: '/stories' });
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = form.get('password') as string;
    const confirm = form.get('confirmPassword') as string;
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email: form.get('email') as string,
      password,
      name: (form.get('email') as string).split('@')[0],
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? 'Registration failed');
      return;
    }
    await router.navigate({ to: '/stories' });
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? 'Failed to send reset email');
      return;
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastEmail(email);
    toastTimerRef.current = setTimeout(() => setToastEmail(null), 5000);
    setResetSent(true);
  };

  return (
    <>
      {view !== 'forgot' && (
        <div role="tablist" className="tabs tabs-border mx-8 mb-6 border-gold/10">
          {(['login', 'register'] as DirectorView[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              onClick={() => switchView(tab)}
              className={cn(
                'tab font-display text-sm tracking-[0.05em]',
                view === tab ? 'tab-active text-base-content' : 'text-base-content/30',
              )}
            >
              {tab === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>
      )}

      <div className="px-8 pb-8">
        {view === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

            <fieldset className="fieldset gap-1">
              <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
                Password
              </legend>
              <PasswordInput name="password" autoComplete="current-password" placeholder="••••••••" />
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'btn btn-primary btn-block mt-1 font-display text-base tracking-[0.08em]',
                loading && 'opacity-60 cursor-not-allowed',
              )}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-base-content/40 mt-1">
              No seat yet?{' '}
              <button
                type="button"
                onClick={() => switchView('register')}
                className="link link-primary text-xs"
              >
                Register →
              </button>
            </p>

            <p className="text-center text-xs text-base-content/40">
              <button
                type="button"
                onClick={() => switchView('forgot')}
                className="link text-xs opacity-60 hover:opacity-100"
              >
                Forgot password?
              </button>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
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

            <fieldset className="fieldset gap-1">
              <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
                Password
              </legend>
              <PasswordInput name="password" autoComplete="new-password" placeholder="••••••••" />
            </fieldset>

            <fieldset className="fieldset gap-1">
              <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
                Confirm Password
              </legend>
              <PasswordInput name="confirmPassword" autoComplete="new-password" placeholder="••••••••" />
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'btn btn-primary btn-block mt-1 font-display text-base tracking-[0.08em]',
                loading && 'opacity-60 cursor-not-allowed',
              )}
            >
              {loading ? 'Reserving…' : 'Reserve your seat'}
            </button>

            <p className="text-center text-xs text-base-content/40 mt-1">
              Already have a seat?{' '}
              <button
                type="button"
                onClick={() => switchView('login')}
                className="link link-primary text-xs"
              >
                Sign in →
              </button>
            </p>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
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
              disabled={loading || resetSent}
              className={cn(
                'btn btn-primary btn-block mt-1 font-display text-base tracking-[0.08em]',
                (loading || resetSent) && 'opacity-60 cursor-not-allowed',
              )}
            >
              {loading ? 'Sending…' : resetSent ? 'Link sent ✓' : 'Send reset link'}
            </button>

            <p className="text-center text-xs text-base-content/40 mt-1">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="link link-primary text-xs"
              >
                ← Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>

      {toastEmail && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success text-sm">
            <span>
              Reset link sent to <strong>{toastEmail}</strong>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
