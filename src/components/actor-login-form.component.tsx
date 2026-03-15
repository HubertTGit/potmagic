import { cn } from '@/lib/cn';

interface ActorLoginFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (email: string) => void;
}

export default function ActorLoginForm({
  loading,
  error,
  onSubmit,
}: ActorLoginFormProps) {
  const handleSubmit = (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit(form.get('email') as string);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'btn btn-block mt-1 font-display text-base tracking-[0.08em] btn-gold',
          loading && 'opacity-60 cursor-not-allowed',
        )}
      >
        {loading ? 'Entering…' : 'Enter →'}
      </button>
    </form>
  );
}
