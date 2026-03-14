import { useState, useRef, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';
import { PropTypePill } from './prop-type-pill';

export type BackgroundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: 'background';
};

interface SceneBackgroundSectionProps {
  isDirector: boolean;
  background: BackgroundProp | null;
  availableBackgrounds: BackgroundProp[];
  onAssignBackground: (bg: BackgroundProp | null) => void;
  isAssigning: boolean;
}

export function SceneBackgroundSection({
  isDirector,
  background,
  availableBackgrounds,
  onAssignBackground,
  isAssigning,
}: SceneBackgroundSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
        Background
      </h2>

      <div className="flex flex-col gap-2 mb-3">
        {!background ? (
          <p className="text-base-content/30 text-sm italic py-2">
            No background assigned.
          </p>
        ) : (
          <div className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300">
            <div className="flex items-center gap-3">
              {background.imageUrl ? (
                <img
                  src={background.imageUrl}
                  alt={background.name}
                  className="size-16 rounded object-cover bg-base-300 shrink-0"
                />
              ) : (
                <div className="size-16 rounded bg-base-300 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{background.name}</span>
                <div className="mt-1">
                  <PropTypePill type="background" />
                </div>
              </div>
            </div>
            {isDirector && (
              <button
                onClick={() => onAssignBackground(null)}
                disabled={isAssigning}
                className="text-xs text-error/60 hover:text-error transition-colors flex items-center gap-1 p-2 hover:bg-error/10 rounded-lg"
                title="Remove background"
              >
                {isAssigning && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                <TrashIcon className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {isDirector && availableBackgrounds.length > 0 && (
        <BackgroundDropdown
          availableBackgrounds={availableBackgrounds}
          onAssign={onAssignBackground}
          currentId={background?.id}
          isLoading={isAssigning}
        />
      )}
    </div>
  );
}

function BackgroundDropdown({
  availableBackgrounds,
  onAssign,
  currentId,
  isLoading,
}: {
  availableBackgrounds: BackgroundProp[];
  onAssign: (bg: BackgroundProp) => void;
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
          <span>{currentId ? 'Change background' : '+ Assign background'}</span>
        )}
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {availableBackgrounds.map((bg) => (
            <button
              key={bg.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onAssign(bg);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-300 transition-colors',
                bg.id === currentId && 'bg-base-300',
              )}
            >
              {bg.imageUrl ? (
                <img
                  src={bg.imageUrl}
                  alt={bg.name}
                  className="size-10 rounded object-cover bg-base-300 shrink-0"
                />
              ) : (
                <div className="size-10 rounded bg-base-300 shrink-0" />
              )}
              <div className="flex flex-col text-left flex-1">
                <span className="font-medium text-xs">{bg.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
