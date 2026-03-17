import React from 'react';
import { cn } from '@/lib/cn';

interface ForgotPasswordFormProps {
  loading: boolean;
  error: string | null;
  resetSent: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

export default function ForgotPasswordForm({
  loading,
  error,
  resetSent,
  onSubmit,
  onBack,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-error text-xs text-center">{error}</p>
      )}

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
          className="input w-full bg-base-200 border-base-300 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading || resetSent}
        className={cn(
          'btn btn-block mt-1 font-display text-base tracking-[0.08em] btn-primary',
          (loading || resetSent) && 'opacity-60 cursor-not-allowed',
        )}
      >
        {loading ? 'Sending…' : resetSent ? 'Link sent ✓' : 'Send reset link'}
      </button>

      <p className="text-center text-xs text-base-content/40 mt-1">
        <button
          type="button"
          onClick={onBack}
          className="text-primary cursor-pointer font-inherit text-xs"
        >
          ← Back to sign in
        </button>
      </p>
    </form>
  );
}
