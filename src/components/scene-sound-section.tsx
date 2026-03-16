import { useState, useRef, useEffect } from 'react';
import { TrashIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';

export type SoundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: 'sound';
};

interface SceneSoundSectionProps {
  isDirector: boolean;
  sound: SoundProp | null;
  availableSounds: SoundProp[];
  onAssignSound: (sound: SoundProp | null) => void;
  isAssigning: boolean;
  autoplay: boolean;
  onToggleAutoplay: (autoplay: boolean) => void;
}

export function SceneSoundSection({
  isDirector,
  sound,
  availableSounds,
  onAssignSound,
  isAssigning,
  autoplay,
  onToggleAutoplay,
}: SceneSoundSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
        Sound
      </h2>

      <div className="flex flex-col gap-2 mb-3">
        {!sound ? (
          <p className="text-base-content/30 text-sm italic py-2">
            No sound assigned.
          </p>
        ) : (
          <div className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300">
            <div className="flex items-center gap-3">
              <div className="size-16 rounded bg-base-300 shrink-0 flex items-center justify-center">
                <MusicalNoteIcon className="size-6 text-base-content/40" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{sound.name}</span>
                {sound.imageUrl && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls src={sound.imageUrl} className="w-50 h-8" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isDirector && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-base-content/50">Autoplay</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-success"
                    checked={autoplay}
                    onChange={(e) => onToggleAutoplay(e.target.checked)}
                  />
                </label>
              )}
              {isDirector && (
                <button
                  onClick={() => onAssignSound(null)}
                  disabled={isAssigning}
                  className="text-xs text-error/60 hover:text-error transition-colors flex items-center gap-1 p-2 hover:bg-error/10 rounded-lg"
                  title="Remove sound"
                >
                  {isAssigning && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  <TrashIcon className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isDirector && availableSounds.length > 0 && (
        <SoundDropdown
          availableSounds={availableSounds}
          onAssign={onAssignSound}
          currentId={sound?.id}
          isLoading={isAssigning}
        />
      )}
    </div>
  );
}

function SoundDropdown({
  availableSounds,
  onAssign,
  currentId,
  isLoading,
}: {
  availableSounds: SoundProp[];
  onAssign: (sound: SoundProp) => void;
  currentId?: string;
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-64">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="btn btn-sm btn-outline btn-info font-display w-full justify-start"
      >
        {isLoading && <span className="loading loading-spinner loading-xs" />}
        {!isLoading && (
          <span>{currentId ? 'Change sound' : '+ Assign sound'}</span>
        )}
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {availableSounds.map((s) => (
            <button
              key={s.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onAssign(s);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-300 transition-colors',
                s.id === currentId && 'bg-base-300',
              )}
            >
              <div className="size-8 rounded bg-base-300 shrink-0 flex items-center justify-center">
                <MusicalNoteIcon className="size-4 text-base-content/40" />
              </div>
              <span className="font-medium text-xs text-left flex-1 truncate">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
