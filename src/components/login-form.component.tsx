import React from 'react';
import { cn } from '@/lib/cn';
import PasswordInput from '@/components/password-input.component';

interface LoginFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export default function LoginForm({
  loading,
  error,
  onSubmit,
  onSwitchToRegister,
  onForgotPassword,
}: LoginFormProps) {
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
          className="input w-full bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
        />
      </fieldset>

      <fieldset className="fieldset gap-1">
        <legend className="fieldset-legend text-xs tracking-[0.1em] text-base-content/40">
          Password
        </legend>
        <PasswordInput
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'btn btn-block mt-1 font-display text-base tracking-[0.08em] btn-gold',
          loading && 'opacity-60 cursor-not-allowed',
        )}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-xs text-base-content/40 mt-1">
        No seat yet?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-gold cursor-pointer font-inherit text-xs"
        >
          Register →
        </button>
      </p>

      <p className="text-center text-xs text-base-content/40">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-gold/60 hover:text-gold cursor-pointer font-inherit text-xs transition-colors"
        >
          Forgot password?
        </button>
      </p>
    </form>
  );
}
