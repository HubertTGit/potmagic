import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { PropTypePill } from '@/components/prop-type-pill';
import type { PropType } from '@/db/schema';

export type PickableProp = {
  id: string;
  name: string;
  type: PropType;
  imageUrl: string | null;
};

interface PropPickerProps {
  propId: string | null;
  propName: string | null;
  propImageUrl: string | null;
  propType: PropType | null;
  availableProps: PickableProp[];
  usedPropIds?: Set<string>;
  onAssign: (propId: string | null) => void;
  isLoading?: boolean;
  placeholder?: string;
  /** Icon shown in image placeholder when imageUrl is null (e.g. MusicalNoteIcon for sounds) */
  fallbackIcon?: ReactNode;
  /** When true, renders only the selected prop image/name with no dropdown */
  readOnly?: boolean;
}

export function PropPicker({
  propId,
  propName,
  propImageUrl,
  propType,
  availableProps,
  usedPropIds,
  onAssign,
  isLoading = false,
  placeholder = 'Assign prop…',
  fallbackIcon,
  readOnly = false,
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

  const usedIds = usedPropIds ?? new Set<string>();

  const selectableProps = availableProps.filter(
    (p) => !usedIds.has(p.id) || p.id === propId,
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

  if (readOnly) {
    if (!propId) return null;
    return (
      <div className="flex items-center gap-2">
        {propImageUrl ? (
          <img
            src={propImageUrl}
            alt={propName ?? ''}
            className="size-12 rounded object-cover bg-base-300 shrink-0"
          />
        ) : (
          <div className="size-12 rounded bg-base-300 shrink-0 flex items-center justify-center">
            {fallbackIcon}
          </div>
        )}
        <span className="text-sm">{propName}</span>
        {propType && <PropTypePill type={propType} />}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        className="flex items-center gap-2 hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : propId ? (
          <>
            {propImageUrl ? (
              <img
                src={propImageUrl}
                alt={propName ?? ''}
                className="size-12 rounded object-cover bg-base-300 shrink-0"
              />
            ) : (
              <div className="size-12 rounded bg-base-300 shrink-0 flex items-center justify-center">
                {fallbackIcon}
              </div>
            )}
            <span className="text-sm">{propName}</span>
            {propType && <PropTypePill type={propType} />}
          </>
        ) : (
          <button className="btn btn-sm btn-outline btn-info font-display w-full justify-start">
            {placeholder}
          </button>
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
              placeholder="Search…"
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
                    onAssign(p.id);
                    close();
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-300/50 transition-colors cursor-pointer',
                    p.id === propId && 'bg-base-300',
                  )}
                >
                  {p.imageUrl && p.type !== 'sound' ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="size-8 rounded object-cover bg-base-300 shrink-0"
                    />
                  ) : (
                    <div className="size-8 rounded bg-base-300 shrink-0 flex items-center justify-center">
                      {fallbackIcon}
                    </div>
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
                  onAssign(null);
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
