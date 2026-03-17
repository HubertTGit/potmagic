import { Link } from '@tanstack/react-router';
import { Trash2, CircleHelp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DataList, DataListItem } from './data-list';
import { PropPicker } from './prop-picker';
import type { PropType } from '@/db/schema';

export type CastMember = {
  id: string; // cast.id
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
                        'ring-2 ring-primary ring-offset-2 ring-offset-base-100',
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
                        <CircleHelp className="size-4 text-primary bg-base-100 rounded-full" />
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
                          <span className="text-sm font-medium">
                            {c.propName}
                          </span>
                          {c.userId === currentUserId && (
                            <div
                              className="tooltip tooltip-right flex items-center"
                              data-tip="Your character is assigned by the director and cannot be changed."
                            >
                              <CircleHelp className="size-3.5 text-base-content/20 hover:text-base-content/40 transition-colors cursor-help" />
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
                      <Trash2 className="size-4" />
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
  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-primary font-display w-64 justify-start"
        aria-disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <span>+ Add cast member</span>
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-200 border border-base-300 rounded-box z-50 w-72 p-0 shadow-xl mt-1 overflow-hidden"
      >
        {availableActors.map((a) => (
          <li key={a.id}>
            <button
              className="flex flex-col items-start gap-0 px-3 py-2 rounded-none"
              onClick={() => {
                onAdd(a.id);
                (document.activeElement as HTMLElement)?.blur();
              }}
            >
              <span className="font-medium text-sm">{a.name}</span>
              <span className="text-xs text-base-content/40">{a.email}</span>
            </button>
          </li>
        ))}
      </ul>
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
