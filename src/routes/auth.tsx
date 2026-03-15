import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { actorSignIn } from '@/lib/actor-auth.fns';
import LoginForm from '@/components/login-form.component';
import RegisterForm from '@/components/register-form.component';
import ForgotPasswordForm from '@/components/forgot-password-form.component';
import ActorLoginForm from '@/components/actor-login-form.component';
import { cn } from '@/lib/cn';

export const Route = createFileRoute('/auth')({
  component: LoginPage,
});

type AuthMode = 'director' | 'actor';
type DirectorView = 'login' | 'register' | 'forgot';

function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('director');
  const [directorView, setDirectorView] = useState<DirectorView>('login');
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

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setDirectorView('login');
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

  const switchDirectorView = (next: DirectorView) => {
    setDirectorView(next);
    setError(null);
    setResetSent(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-bg">
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

          {/* Director / Actor mode tabs */}
          <div role="tablist" className="tabs tabs-border mx-8 mb-4 border-gold/15">
            {(['director', 'actor'] as AuthMode[]).map((m) => (
              <button
                key={m}
                role="tab"
                onClick={() => switchMode(m)}
                className={cn(
                  'tab font-display text-base tracking-[0.05em] capitalize',
                  mode === m
                    ? 'tab-active text-gold'
                    : 'text-base-content/30',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Director sub-tabs (Sign In / Register) */}
          {mode === 'director' && directorView !== 'forgot' && (
            <div role="tablist" className="tabs tabs-border mx-8 mb-6 border-gold/10">
              {(['login', 'register'] as DirectorView[]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  onClick={() => switchDirectorView(tab)}
                  className={cn(
                    'tab font-display text-sm tracking-[0.05em]',
                    directorView === tab
                      ? 'tab-active text-base-content'
                      : 'text-base-content/30',
                  )}
                >
                  {tab === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* Forms */}
          <div className="px-8 pb-8">
            {mode === 'director' ? (
              directorView === 'login' ? (
                <LoginForm
                  loading={loading}
                  error={error}
                  onSubmit={handleLogin}
                  onSwitchToRegister={() => switchDirectorView('register')}
                  onForgotPassword={() => switchDirectorView('forgot')}
                />
              ) : directorView === 'register' ? (
                <RegisterForm
                  loading={loading}
                  error={error}
                  onSubmit={handleRegister}
                  onSwitchToLogin={() => switchDirectorView('login')}
                />
              ) : (
                <ForgotPasswordForm
                  loading={loading}
                  error={error}
                  resetSent={resetSent}
                  onSubmit={handleForgotPassword}
                  onBack={() => switchDirectorView('login')}
                />
              )
            ) : (
              <ActorLoginForm
                loading={loading}
                error={error}
                onSubmit={handleActorLogin}
              />
            )}
          </div>
        </div>
      </div>

      {toastEmail && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success text-sm">
            <span>Reset link sent to <strong>{toastEmail}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
