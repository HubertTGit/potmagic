import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';

export default function DirectorLogin({ token = '' }: { token?: string }) {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const callbackURL = token
    ? `/auth/director-setup?token=${encodeURIComponent(token)}`
    : '/stories';

  const handleSend = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email = new FormData(e.currentTarget).get('email') as string;
    const { error } = await authClient.signIn.magicLink({ email, callbackURL });
    setLoading(false);
    if (error) {
      setError(error.message ?? 'Failed to send link');
      return;
    }
    setSentEmail(email);
    setSent(true);
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await authClient.signIn.social({ provider: 'google', callbackURL });
    if (error) {
      setError(error.message ?? 'Google sign-in failed');
      setGoogleLoading(false);
    }
    // on success the browser redirects — component unmounts
  };

  return (
    <div className="card bg-base-100 rounded-box overflow-hidden border border-primary/25 w-full max-w-sm mx-4">
      <div className="card-body gap-0 p-0">
        <div className="px-8 pt-6">
          <Link to="/" className="text-xs text-base-content/40 hover:text-base-content transition-colors">
            ← Home
          </Link>
        </div>

        <div className="px-8 pt-4 pb-6 text-center">
          <h1 className={cn('card-title justify-center font-display italic font-semibold text-5xl leading-none mb-2 text-primary tracking-[-0.01em]')}>
            potmagic
          </h1>
          <p className="font-display text-sm tracking-[0.25em] uppercase text-base-content/40">
            Enter the stage
          </p>
        </div>

        {sent ? (
          <div className="px-8 pb-8 text-center flex flex-col gap-3">
            <p className="text-base-content/60 text-sm">
              Check your inbox — we sent a sign-in link to
            </p>
            <p className="text-base-content font-medium text-sm">{sentEmail}</p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="link text-xs opacity-50 hover:opacity-100 mt-2"
            >
              ← Try a different email
            </button>
          </div>
        ) : (
          <div className="px-8 pb-8 flex flex-col gap-4">
            {error && <p className="text-error text-xs text-center">{error}</p>}

            <form onSubmit={handleSend} className="flex flex-col gap-4">
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
                disabled={loading || googleLoading}
                className={cn(
                  'btn btn-primary btn-block font-display text-base tracking-[0.08em]',
                  (loading || googleLoading) && 'opacity-60 cursor-not-allowed',
                )}
              >
                {loading ? 'Sending…' : 'Use Magic Link'}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-base-content/10" />
              <span className="text-xs text-base-content/30">or</span>
              <div className="flex-1 h-px bg-base-content/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              className={cn(
                'btn btn-block bg-base-100 text-base-content border border-base-content/20 hover:bg-base-200 gap-2',
                (loading || googleLoading) && 'opacity-60 cursor-not-allowed',
              )}
            >
              {googleLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
              )}
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
