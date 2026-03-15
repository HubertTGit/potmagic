import { cn } from '@/lib/cn';

interface PropTypePillProps {
  type: 'character' | 'background' | 'animation';
  className?: string;
}

export function PropTypePill({ type, className }: PropTypePillProps) {
  return (
    <div
      className={cn(
        'badge badge-xs font-bold uppercase tracking-widest py-2 shrink-0',
        type === 'character'
          ? 'badge-soft badge-primary'
          : type === 'background'
            ? 'badge-soft badge-info'
            : 'badge-soft badge-secondary',
        className,
      )}
    >
      {type}
    </div>
  );
}
