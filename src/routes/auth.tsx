import { createFileRoute, Link } from '@tanstack/react-router';
import DirectorLogin from '@/components/director-login.component';

export const Route = createFileRoute('/auth')({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center login-bg">
      <div className="relative w-full max-w-sm mx-4">
        <div className="login-card rounded-box overflow-hidden border border-gold/25">
          <div className="px-8 pt-6">
            <Link to="/" className="text-xs text-base-content/40 hover:text-base-content transition-colors">
              ← Home
            </Link>
          </div>
          <div className="px-8 pt-4 pb-6 text-center">
            <h1 className="font-display italic font-semibold text-5xl leading-none mb-2 text-gold gold-glow tracking-[-0.01em]">
              potmagic
            </h1>
            <p className="font-display text-sm tracking-[0.25em] uppercase text-base-content/40">
              Enter the stage
            </p>
          </div>
          <DirectorLogin />
        </div>
      </div>
    </div>
  );
}
