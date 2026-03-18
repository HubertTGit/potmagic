import { Link } from "@tanstack/react-router";
import { Trash2, CircleHelp } from "lucide-react";
import { cn } from "@/lib/cn";
import { DataList, DataListItem } from "@/components/data-list";
import { PropPicker } from "@/components/prop-picker";
import type { PropType } from "@/db/schema";

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
      <div className="my-3 flex items-center justify-between">
        <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
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
          <DataListItem className="text-base-content/40 p-4 text-sm italic">
            No Actor to cast, can't assign yet.
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
                <div className="flex w-48 shrink-0 items-center gap-3">
                  <div
                    className={cn(
                      "bg-base-300 relative flex size-9 shrink-0 items-center justify-center rounded-full",
                      c.userId === currentUserId &&
                        "ring-primary ring-offset-base-100 ring-2 ring-offset-2",
                    )}
                  >
                    {c.userImage ? (
                      <img
                        src={c.userImage}
                        alt={c.userName ?? ""}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-base-content/30 text-xs font-bold uppercase">
                        {c.userName?.slice(0, 2)}
                      </span>
                    )}
                    {c.userId === currentUserId && (
                      <div
                        className="tooltip tooltip-top absolute -top-2 -right-2 flex size-5 items-center justify-center"
                        data-tip="This is you"
                      >
                        <CircleHelp className="text-primary bg-base-100 size-4 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{c.userName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base-content/40 text-[10px] font-bold tracking-widest uppercase">
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
                          alt={c.propName ?? ""}
                          className="bg-base-300 size-7 shrink-0 rounded object-cover"
                        />
                      ) : c.propId ? (
                        <div className="bg-base-300 size-7 shrink-0 rounded" />
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
                              <CircleHelp className="text-base-content/20 hover:text-base-content/40 size-3.5 cursor-help transition-colors" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-base-content/30 text-sm italic">
                          No character assigned
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isDirector && (
                  <div className="flex shrink-0 justify-end">
                    <button
                      onClick={() => onRemoveCast(c)}
                      disabled={isRemovingCast}
                      className="text-error/60 hover:text-error hover:bg-error/10 rounded-lg p-2 text-xs transition-colors"
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
        className="dropdown-content menu bg-base-200 border-base-300 rounded-box z-50 mt-1 w-72 overflow-hidden border p-0 shadow-xl"
      >
        {availableActors.map((a) => (
          <li key={a.id}>
            <button
              className="flex flex-col items-start gap-0 rounded-none px-3 py-2"
              onClick={() => {
                onAdd(a.id);
                (document.activeElement as HTMLElement)?.blur();
              }}
            >
              <span className="text-sm font-medium">{a.name}</span>
              <span className="text-base-content/40 text-xs">{a.email}</span>
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
    <div className="join border-base-300 rounded-2xl border">
      {nav?.all ? (
        nav.all.map((s, idx) => (
          <Link
            key={s.id}
            to="/stories/$storyId/scenes/$sceneId"
            params={{ storyId, sceneId: s.id }}
            className={cn(
              "join-item btn btn-xs",
              s.id === sceneId ? "btn-primary" : "btn-ghost",
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
