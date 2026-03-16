import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';

export default function DirectorLogin() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email = new FormData(e.currentTarget).get('email') as string;
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: '/auth/director-setup',
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? 'Failed to send link');
      return;
    }
    setSentEmail(email);
    setSent(true);
  };

  if (sent) {
    return (
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
    );
  }

  return (
    <form onSubmit={handleSend} className="px-8 pb-8 flex flex-col gap-4">
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
        {loading ? 'Sending…' : 'Send Magic Link'}
      </button>
    </form>
  );
}
