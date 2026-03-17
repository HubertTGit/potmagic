import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';
import { DataList, DataListItem } from './data-list';
import { PropPicker } from './prop-picker';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import type { PropType } from '@/db/schema';

export type CastMember = {
  id: string;          // cast.id
  sceneCastId: string; // sceneCast.id — needed for prop assignment
  userId: string;
  userName: string | null;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: PropType | null;
  userImage: string | null;
};

type AvailableActor = {
  id: string;
  name: string;
  email: string;
};

type AvailableProp = {
  id: string;
  name: string;
  type: PropType;
  imageUrl: string | null;
};

interface SceneCastSectionProps {
  storyId: string;
  sceneId: string;
  isDirector: boolean;
  assignedCast: CastMember[];
  availableActors: AvailableActor[];
  availableProps: AvailableProp[];
  onAddCast: (userId: string) => void;
  onRemoveCast: (castMember: CastMember) => void;
  onAssignProp: (sceneCastId: string, propId: string | null) => void; // sceneCastId bound at call site
  isAddingCast: boolean;
  isRemovingCast: boolean;
  assigningPropCastId?: string;
  sceneOrder: number;
  totalScenes: number;
  nav?: {
    prev?: { id: string } | null;
    next?: { id: string } | null;
    all?: { id: string; title: string }[] | null;
  } | null;
  currentUserId?: string;
}

export function SceneCastSection({
  storyId,
  sceneId,
  isDirector,
  assignedCast,
  availableActors,
  availableProps,
  onAddCast,
  onRemoveCast,
  onAssignProp,
  isAddingCast,
  isRemovingCast,
  assigningPropCastId,
  sceneOrder,
  totalScenes,
  nav,
  currentUserId,
}: SceneCastSectionProps) {
  const usedPropIds = new Set(
    assignedCast.map((c) => c.propId).filter(Boolean) as string[],
  );

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
          [...assignedCast]
            .sort((a, b) => {
              if (a.userId === currentUserId) return -1;
              if (b.userId === currentUserId) return 1;
              return 0;
            })
            .map((c) => (
              <DataListItem key={c.id}>
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <div
                    className={cn(
                      'relative size-9 rounded-full flex items-center justify-center bg-base-300 shrink-0',
                      c.userId === currentUserId &&
                        'ring-2 ring-gold ring-offset-2 ring-offset-base-100 shadow-[0_0_10px_rgba(212,175,55,0.3)]',
                    )}
                  >
                    {c.userImage ? (
                      <img
                        src={c.userImage}
                        alt={c.userName ?? ''}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold uppercase text-base-content/30">
                        {c.userName?.slice(0, 2)}
                      </span>
                    )}
                    {c.userId === currentUserId && (
                      <div
                        className="absolute -top-2 -right-2 size-5 flex items-center justify-center tooltip tooltip-top"
                        data-tip="This is you"
                      >
                        <QuestionMarkCircleIcon className="size-4 text-primary bg-base-100 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{c.userName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-base-content/40 uppercase tracking-widest font-bold">
                        Actor
                      </span>
                    </div>
                  </div>
                </div>

                <div className="list-col-grow">
                  {isDirector ? (
                    <PropPicker
                      isLoading={assigningPropCastId === c.sceneCastId}
                      propId={c.propId ?? null}
                      propName={c.propName ?? null}
                      propImageUrl={c.propImageUrl ?? null}
                      propType={c.propType ?? null}
                      availableProps={availableProps}
                      usedPropIds={usedPropIds}
                      onAssign={(propId) => onAssignProp(c.sceneCastId, propId)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {c.propImageUrl ? (
                        <img
                          src={c.propImageUrl}
                          alt={c.propName ?? ''}
                          className="size-7 rounded object-cover bg-base-300 shrink-0"
                        />
                      ) : c.propId ? (
                        <div className="size-7 rounded bg-base-300 shrink-0" />
                      ) : null}
                      {c.propName ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{c.propName}</span>
                          {c.userId === currentUserId && (
                            <div
                              className="tooltip tooltip-right flex items-center"
                              data-tip="Your character is assigned by the director and cannot be changed."
                            >
                              <QuestionMarkCircleIcon className="size-3.5 text-base-content/20 hover:text-base-content/40 transition-colors cursor-help" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-base-content/30 italic">
                          No character assigned
                        </span>
                      )}
                    </div>
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

      {isDirector && availableActors.length > 0 && (
        <ActorDropdown
          availableActors={availableActors}
          onAdd={onAddCast}
          isLoading={isAddingCast}
        />
      )}
    </div>
  );
}


function ActorDropdown({
  availableActors,
  onAdd,
  isLoading,
}: {
  availableActors: AvailableActor[];
  onAdd: (userId: string) => void;
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
          {availableActors.map((a) => (
            <button
              key={a.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onAdd(a.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-300 transition-colors"
            >
              <div className="flex flex-col text-left flex-1">
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-base-content/40">{a.email}</span>
              </div>
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
