import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function PasswordInput({
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
        className="input w-full bg-base-200 border-base-300 text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}
