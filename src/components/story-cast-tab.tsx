import { useState, useRef, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';
import { PropTypePill } from './prop-type-pill';
import type { PropType } from '@/db/schema';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

type Prop = {
  id: string;
  name: string;
  type: PropType;
  imageUrl: string | null;
};

type CastMember = {
  id: string;
  userId: string;
  userName: string | null;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: PropType | null;
  userImage: string | null;
};

type Actor = {
  id: string;
  name: string;
  email: string;
};

interface StoryCastTabProps {
  cast: CastMember[];
  availableProps: Prop[];
  availableActors: Actor[];
  isDirector: boolean;
  onAddCast: (userId: string) => void;
  onRemoveCast: (castId: string, name: string) => void;
  onAssignProp: (castId: string, propId: string | null) => void;
  isRemovingCast: boolean;
  currentUserId?: string;
}

function PropPicker({
  castId,
  propId,
  propName,
  propImageUrl,
  propType,
  availableProps,
  usedPropIds,
  onAssign,
}: {
  castId: string;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: PropType | null;
  availableProps: Prop[];
  usedPropIds: Set<string>;
  onAssign: (castId: string, propId: string | null) => void;
}) {
  // Show props not used by other cast members, plus the currently assigned one, and ONLY of type 'character'
  const selectableProps = availableProps.filter(
    (p) =>
      p.type === 'character' && (!usedPropIds.has(p.id) || p.id === propId),
  );

  const closeDropdown = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="dropdown dropdown-bottom dropdown-start">
      <div
        tabIndex={0}
        role="button"
        className="flex items-center gap-2 hover:opacity-75 transition-opacity cursor-pointer"
      >
        {propId ? (
          <>
            {propImageUrl ? (
              <img
                src={propImageUrl}
                alt={propName ?? ''}
                className="size-7 rounded object-cover bg-base-300 shrink-0"
              />
            ) : (
              <div className="size-7 rounded bg-base-300 shrink-0" />
            )}
            <span className="text-sm">{propName}</span>
            {propType && <PropTypePill type={propType} />}
          </>
        ) : (
          <span className="text-sm text-base-content/30 italic">
            Assign prop…
          </span>
        )}
      </div>

      <div
        tabIndex={0}
        className="dropdown-content mt-1 w-64 bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden"
      >
        {selectableProps.length === 0 ? (
          <p className="text-xs text-base-content/40 px-3 py-2">
            No props available
          </p>
        ) : (
          <div className="flex flex-col">
            {selectableProps.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onAssign(castId, p.id);
                  closeDropdown();
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-300/50 transition-colors cursor-pointer',
                  p.id === propId && 'bg-base-300',
                )}
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="size-8 rounded object-cover bg-base-300 shrink-0"
                  />
                ) : (
                  <div className="size-8 rounded bg-base-300 shrink-0" />
                )}
                <span className="flex-1 text-left truncate">{p.name}</span>
                <PropTypePill type={p.type} />
              </button>
            ))}
          </div>
        )}

        {propId && (
          <>
            <div className="border-t border-base-300" />
            <button
              onClick={() => {
                onAssign(castId, null);
                closeDropdown();
              }}
              className="btn btn-xs btn-primary float-end m-3"
            >
              Unassign
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { DataList, DataListItem } from './data-list';

export function StoryCastTab({
  cast,
  availableProps,
  availableActors,
  isDirector,
  onAddCast,
  onRemoveCast,
  onAssignProp,
  isRemovingCast,
  currentUserId,
}: StoryCastTabProps) {
  const [actorSearch, setActorSearch] = useState('');
  const [actorDropdownOpen, setActorDropdownOpen] = useState(false);
  const actorSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        actorSearchRef.current &&
        !actorSearchRef.current.contains(e.target as Node)
      ) {
        setActorDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const castUserIds = new Set(cast.map((c) => c.userId));
  const usedPropIds = new Set(
    cast.map((c) => c.propId).filter(Boolean) as string[],
  );
  const filteredActors = availableActors.filter(
    (u) =>
      !castUserIds.has(u.id) &&
      (u.name.toLowerCase().includes(actorSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(actorSearch.toLowerCase())),
  );

  return (
    <div>
      <DataList>
        {cast.length === 0 ? (
          <DataListItem className="p-4 text-base-content/40 text-sm italic">
            No actors cast yet.
          </DataListItem>
        ) : (
          [...cast]
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
                      castId={c.id}
                      propId={c.propId ?? null}
                      propName={c.propName ?? null}
                      propImageUrl={c.propImageUrl ?? null}
                      propType={c.propType ?? null}
                      availableProps={availableProps}
                      usedPropIds={usedPropIds}
                      onAssign={onAssignProp}
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
                        <span className="text-sm">{c.propName}</span>
                      ) : (
                        <span className="text-sm text-base-content/30 italic">
                          No prop assigned
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isDirector && (
                  <div className="flex justify-end shrink-0">
                    <button
                      onClick={() =>
                        onRemoveCast(c.id, c.userName ?? 'Unknown Actor')
                      }
                      disabled={isRemovingCast}
                      className="text-xs text-error/60 hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg"
                      title="Remove from cast"
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
        <div ref={actorSearchRef} className="relative w-64">
          <input
            type="text"
            value={actorSearch}
            onChange={(e) => {
              setActorSearch(e.target.value);
              setActorDropdownOpen(true);
            }}
            onFocus={() => setActorDropdownOpen(true)}
            placeholder="Search actors…"
            className="input input-sm w-full bg-base-200 border-base-300 text-sm focus:border-gold/60 focus:ring-2 focus:ring-gold/10"
          />
          {actorDropdownOpen && (
            <div className="absolute top-full mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-lg z-10 overflow-hidden">
              {filteredActors.length === 0 ? (
                <p className="text-xs text-base-content/40 px-3 py-2">
                  No actors found
                </p>
              ) : (
                filteredActors.map((u) => (
                  <button
                    key={u.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onAddCast(u.id);
                      setActorSearch('');
                      setActorDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-base-300 transition-colors flex flex-col"
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-xs text-base-content/40">
                      {u.email}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
