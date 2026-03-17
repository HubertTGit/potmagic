import React from 'react';
import { cn } from '@/lib/cn';
import PasswordInput from '@/components/password-input.component';

interface RegisterFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterForm({
  loading,
  error,
  onSubmit,
  onSwitchToLogin,
}: RegisterFormProps) {
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

      <fieldset className="fieldset gap-1">
        <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
          Password
        </legend>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </fieldset>

      <fieldset className="fieldset gap-1">
        <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
          Confirm Password
        </legend>
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'btn btn-block mt-1 font-display text-base tracking-[0.08em] btn-primary',
          loading && 'opacity-60 cursor-not-allowed',
        )}
      >
        {loading ? 'Reserving…' : 'Reserve your seat'}
      </button>

      <p className="text-center text-xs text-base-content/40 mt-1">
        Already have a seat?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary cursor-pointer font-inherit text-xs"
        >
          Sign in →
        </button>
      </p>
    </form>
  );
}
