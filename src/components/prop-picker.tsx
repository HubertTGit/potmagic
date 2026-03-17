import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { PropTypePill } from './prop-type-pill';
import type { PropType } from '@/db/schema';

type AvailableProp = {
  id: string;
  name: string;
  type: PropType;
  imageUrl: string | null;
};

interface PropPickerProps {
  sceneCastId: string;
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: PropType | null;
  availableProps: AvailableProp[];
  usedPropIds: Set<string>;
  onAssign: (sceneCastId: string, propId: string | null) => void;
}

export function PropPicker({
  sceneCastId,
  propId,
  propName,
  propImageUrl,
  propType,
  availableProps,
  usedPropIds,
  onAssign,
}: PropPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectableProps = availableProps.filter(
    (p) =>
      p.type === 'character' && (!usedPropIds.has(p.id) || p.id === propId),
  );

  const filtered = search.trim()
    ? selectableProps.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : selectableProps;

  const close = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-base-200 border border-base-300 rounded-lg shadow-xl z-50 flex flex-col max-h-72">
          {/* Search */}
          <div className="p-2 border-b border-base-300 shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search props…"
              className="input input-sm w-full"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto min-h-0 flex-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-base-content/40 px-3 py-3">
                {search ? 'No matches' : 'No props available'}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onAssign(sceneCastId, p.id);
                    close();
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
              ))
            )}
          </div>

          {propId && (
            <>
              <div className="border-t border-base-300 shrink-0" />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAssign(sceneCastId, null);
                  close();
                }}
                className="btn btn-xs btn-primary self-end m-3"
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
