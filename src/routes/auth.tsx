import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import DirectorLogin from '@/components/director-login.component';
import ActorLogin from '@/components/actor-login.component';

export const Route = createFileRoute('/auth')({
  component: LoginPage,
});

type AuthMode = 'director' | 'actor';

function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('director');

  return (
    <div className="min-h-screen flex items-center justify-center login-bg">
      <div className="relative w-full max-w-sm mx-4">
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

          {mode === 'director' ? <DirectorLogin /> : <ActorLogin />}

          {/* Mode switcher */}
          <div className="flex justify-center pb-6">
            {mode === 'director' ? (
              <button
                type="button"
                onClick={() => setMode('actor')}
                className="btn btn-sm btn-accent font-display tracking-[0.05em]"
              >
                Actor login →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('director')}
                className="btn btn-sm btn-accent font-display tracking-[0.05em]"
              >
                Director login →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
