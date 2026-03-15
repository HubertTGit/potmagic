import { useState, useRef, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import LoginForm from '@/components/login-form.component';
import RegisterForm from '@/components/register-form.component';
import ForgotPasswordForm from '@/components/forgot-password-form.component';
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
        {view === 'login' ? (
          <LoginForm
            loading={loading}
            error={error}
            onSubmit={handleLogin}
            onSwitchToRegister={() => switchView('register')}
            onForgotPassword={() => switchView('forgot')}
          />
        ) : view === 'register' ? (
          <RegisterForm
            loading={loading}
            error={error}
            onSubmit={handleRegister}
            onSwitchToLogin={() => switchView('login')}
          />
        ) : (
          <ForgotPasswordForm
            loading={loading}
            error={error}
            resetSent={resetSent}
            onSubmit={handleForgotPassword}
            onBack={() => switchView('login')}
          />
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
