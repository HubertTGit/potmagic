import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';
import { PropTypePill } from './prop-type-pill';

export type CastMember = {
  id: string;
  userId: string;
  userName: string | null;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: 'background' | 'character' | null;
};

interface SceneCastSectionProps {
  storyId: string;
  sceneId: string;
  isDirector: boolean;
  assignedCast: CastMember[];
  availableCast: CastMember[];
  onAddCast: (castMember: CastMember) => void;
  onRemoveCast: (castMember: CastMember) => void;
  isAddingCast: boolean;
  isRemovingCast: boolean;
  sceneOrder: number;
  totalScenes: number;
  nav?: {
    prev?: { id: string } | null;
    next?: { id: string } | null;
  } | null;
}

export function SceneCastSection({
  storyId,
  sceneId,
  isDirector,
  assignedCast,
  availableCast,
  onAddCast,
  onRemoveCast,
  isAddingCast,
  isRemovingCast,
  sceneOrder,
  totalScenes,
  nav,
}: SceneCastSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center my-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
          Cast
        </h2>

        {/* Scene navigator */}
        <div className="flex justify-end items-center gap-2 text-sm text-base-content/40">
          {nav?.prev ? (
            <Link
              to="/stories/$storyId/scenes/$sceneId"
              params={{ storyId, sceneId: nav.prev.id }}
              className="btn btn-xs btn-secondary px-2"
            >
              ‹
            </Link>
          ) : (
            <span className="btn btn-xs btn-ghost px-2 opacity-20 pointer-events-none">
              ‹
            </span>
          )}
          <span>
            <strong className="text-base-content">{sceneOrder}</strong> of{' '}
            {totalScenes}
          </span>
          {nav?.next ? (
            <Link
              to="/stories/$storyId/scenes/$sceneId"
              params={{ storyId, sceneId: nav.next.id }}
              className="btn btn-xs btn-secondary px-2"
            >
              ›
            </Link>
          ) : (
            <span className="btn btn-xs btn-ghost px-2 opacity-20 pointer-events-none">
              ›
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {assignedCast.length === 0 ? (
          <p className="text-base-content/30 text-sm italic py-2">
            No cast assigned yet.
          </p>
        ) : (
          assignedCast.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300"
            >
              <div className="flex items-center gap-3">
                {c.propImageUrl ? (
                  <img
                    src={c.propImageUrl}
                    alt={c.propName ?? ''}
                    className="size-8 rounded object-cover bg-base-300 shrink-0"
                  />
                ) : (
                  <div className="size-8 rounded bg-base-300 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{c.userName}</span>
                  {c.propName && (
                    <span className="text-xs text-base-content/40">
                      {c.propName}
                    </span>
                  )}
                </div>
                {c.propType && (
                  <PropTypePill type={c.propType as 'character' | 'background'} />
                )}
              </div>
              {isDirector && (
                <button
                  onClick={() => onRemoveCast(c)}
                  disabled={isRemovingCast}
                  className="text-xs text-error/60 hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg"
                  title="Remove from scene"
                >
                  <TrashIcon className="size-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isDirector && availableCast.length > 0 && (
        <CastDropdown
          availableCast={availableCast}
          onAdd={onAddCast}
          isLoading={isAddingCast}
        />
      )}
    </div>
  );
}

function CastDropdown({
  availableCast,
  onAdd,
  isLoading,
}: {
  availableCast: CastMember[];
  onAdd: (castMember: CastMember) => void;
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
        className="btn btn-sm btn-outline btn-primary font-display w-full justify-start"
      >
        {isLoading && <span className="loading loading-spinner loading-xs" />}
        {!isLoading && <span>+ Add cast member</span>}
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-72 bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {availableCast.map((c) => (
            <button
              key={c.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onAdd(c);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-300 transition-colors"
            >
              {c.propImageUrl ? (
                <img
                  src={c.propImageUrl}
                  alt={c.propName ?? ''}
                  className="size-8 rounded object-cover bg-base-300 shrink-0"
                />
              ) : (
                <div className="size-8 rounded bg-base-300 shrink-0" />
              )}
              <div className="flex flex-col text-left flex-1">
                <span className="font-medium">{c.userName}</span>
                {c.propName && (
                  <span className="text-xs text-base-content/40">
                    {c.propName}
                  </span>
                )}
              </div>
              {c.propType && (
                <PropTypePill type={c.propType as 'character' | 'background'} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
