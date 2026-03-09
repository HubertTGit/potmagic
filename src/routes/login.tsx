import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { cn } from '../lib/cn';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authClient } from '../lib/auth-client';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

type Tab = 'login' | 'register';

function PasswordInput({
  name,
  autoComplete,
  placeholder,
}: {
  name: string;
  autoComplete: string;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="input w-full bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <EyeSlashIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </button>
    </div>
  );
}

function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    await router.navigate({ to: '/' });
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
    await router.navigate({ to: '/' });
  };

  return (
    <div className="flex-1 flex items-center justify-center login-bg">
      <div className="relative w-full max-w-sm mx-4">
        {/* Card */}
        <div className="login-card rounded-box overflow-hidden border border-gold/25">
          {/* Brand header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <h1 className="font-display italic font-semibold text-5xl leading-none mb-2 text-gold gold-glow tracking-[-0.01em]">
              potmagic
            </h1>
            <p className="font-display text-sm tracking-[0.25em] uppercase text-base-content/40">
              Enter the stage
            </p>
          </div>

          {/* Tab switcher */}
          <div
            role="tablist"
            className="tabs tabs-border mx-8 mb-6 border-gold/15"
          >
            {(['login', 'register'] as Tab[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                onClick={() => {
                  setActiveTab(tab);
                  setError(null);
                }}
                className={cn(
                  'tab font-display text-base tracking-[0.05em]',
                  activeTab === tab
                    ? 'tab-active text-gold'
                    : 'text-base-content/30',
                )}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="px-8 pb-8">
            {error && (
              <p className="text-error text-xs mb-4 text-center">{error}</p>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                    onClick={() => setActiveTab('register')}
                    className="text-gold cursor-pointer font-inherit text-xs"
                  >
                    Register →
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
                    'btn btn-block mt-1 font-display text-base tracking-[0.08em] btn-gold',
                    loading && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  {loading ? 'Reserving…' : 'Reserve your seat'}
                </button>

                <p className="text-center text-xs text-base-content/40 mt-1">
                  Already have a seat?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-gold cursor-pointer font-inherit text-xs"
                  >
                    Sign in →
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
