import { useState, useRef, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';

type Prop = {
  id: string;
  name: string;
  type: 'background' | 'character';
  imageUrl: string | null;
};

type CastMember = {
  id: string;
  userId: string;
  userName: string | null;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: 'background' | 'character' | null;
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
}

function PropTypePill({ type }: { type: 'character' | 'background' }) {
  return (
    <span
      className={cn(
        'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
        type === 'character' ? 'bg-gold/15 text-gold' : 'bg-info/15 text-info',
      )}
    >
      {type}
    </span>
  );
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
  propType: 'character' | 'background' | null;
  availableProps: Prop[];
  usedPropIds: Set<string>;
  onAssign: (castId: string, propId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Show props not used by other cast members, plus the currently assigned one, and ONLY of type 'character'
  const selectableProps = availableProps.filter(
    (p) =>
      p.type === 'character' && (!usedPropIds.has(p.id) || p.id === propId),
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
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
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 overflow-hidden">
          {selectableProps.length === 0 ? (
            <p className="text-xs text-base-content/40 px-3 py-2">
              No props available
            </p>
          ) : (
            selectableProps.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAssign(castId, p.id);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-300 transition-colors',
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
            ))
          )}
          {propId && (
            <>
              <div className="border-t border-base-300" />
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAssign(castId, null);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-error/60 hover:text-error hover:bg-base-300 transition-colors"
              >
                Unassign
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function StoryCastTab({
  cast,
  availableProps,
  availableActors,
  isDirector,
  onAddCast,
  onRemoveCast,
  onAssignProp,
  isRemovingCast,
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
      <ul className="list bg-base-100 rounded-box shadow-sm mb-4 border border-base-300">
        {cast.length === 0 ? (
          <li className="list-row p-4 text-base-content/40 text-sm italic">No actors cast yet.</li>
        ) : (
          cast.map((c) => (
          <li
            key={c.id}
            className="list-row items-center hover:bg-base-200/50 transition-colors group first:rounded-t-box last:rounded-b-box"
          >
            <div className="flex flex-col gap-0.5 w-48 shrink-0">
              <span className="text-sm font-semibold">{c.userName}</span>
              <span className="text-[10px] text-base-content/40 uppercase tracking-widest font-bold">
                Actor
              </span>
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
              ) : c.propId ? (
                <div className="flex items-center gap-2">
                  {c.propImageUrl ? (
                    <img
                      src={c.propImageUrl}
                      alt={c.propName ?? ''}
                      className="size-7 rounded object-cover bg-base-300 shrink-0"
                    />
                  ) : (
                    <div className="size-7 rounded bg-base-300 shrink-0" />
                  )}
                  <span className="text-sm">{c.propName}</span>
                </div>
              ) : (
                <span className="text-sm text-base-content/30 italic">
                  No prop assigned
                </span>
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
          </li>
          ))
        )}
      </ul>

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
