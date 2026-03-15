import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';
import { DataList, DataListItem } from './data-list';
import { PropTypePill } from './prop-type-pill';
import type { PropType } from '@/db/schema';

export type CastMember = {
  id: string;
  userId: string;
  userName: string | null;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: PropType | null;
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
    all?: { id: string; title: string }[] | null;
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

        <SceneNavigator
          storyId={storyId}
          sceneId={sceneId}
          sceneOrder={sceneOrder}
          totalScenes={totalScenes}
          nav={nav}
        />
      </div>

      <DataList>
        {assignedCast.length === 0 ? (
          <DataListItem className="p-4 text-base-content/40 text-sm italic">
            No cast assigned yet.
          </DataListItem>
        ) : (
          assignedCast.map((c) => (
            <DataListItem
              key={c.id}
            >
              <div className="flex items-center gap-3 list-col-grow">
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
                  <PropTypePill
                    type={c.propType as PropType}
                  />
                )}
              </div>
              {isDirector && (
                <div className="flex justify-end shrink-0">
                  <button
                    onClick={() => onRemoveCast(c)}
                    disabled={isRemovingCast}
                    className="text-xs text-error/60 hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg"
                    title="Remove from scene"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              )}
            </DataListItem>
          ))
        )}
      </DataList>

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
                <PropTypePill type={c.propType as PropType} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SceneNavigator({
  storyId,
  sceneId,
  sceneOrder,
  totalScenes,
  nav,
}: {
  storyId: string;
  sceneId: string;
  sceneOrder: number;
  totalScenes: number;
  nav?: {
    all?: { id: string; title: string }[] | null;
  } | null;
}) {
  return (
    <div className="join border border-base-300 rounded-2xl">
      {nav?.all ? (
        nav.all.map((s, idx) => (
          <Link
            key={s.id}
            to="/stories/$storyId/scenes/$sceneId"
            params={{ storyId, sceneId: s.id }}
            className={cn(
              'join-item btn btn-xs',
              s.id === sceneId ? 'btn-primary' : 'btn-ghost',
            )}
          >
            {idx + 1}
          </Link>
        ))
      ) : (
        <button className="join-item btn btn-xs">{sceneOrder}</button>
      )}
    </div>
  );
}
