import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PropTypePill } from "@/components/prop-type-pill";
import type { PropType } from "@/db/schema";
import { useLanguage } from "@/hooks/useLanguage";

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
  propType: PropType | PropType[] | null;
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
  placeholder = "Assign prop…",
  fallbackIcon,
  readOnly = false,
}: PropPickerProps) {
  const { t } = useLanguage();
  const propTypes = propType
    ? Array.isArray(propType)
      ? propType
      : [propType]
    : [];
  const hasVisualImage =
    !!propImageUrl && !propTypes.some((pt) => pt === "rive" || pt === "sound");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
    setSearch("");
  };

  if (readOnly) {
    if (!propId) return null;
    return (
      <div className="flex items-center gap-2">
        {hasVisualImage ? (
          <img
            src={propImageUrl!}
            alt={propName ?? ""}
            className="bg-base-300 size-12 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="bg-base-300 flex size-12 shrink-0 items-center justify-center rounded">
            {fallbackIcon}
          </div>
        )}
        <span className="text-sm">{propName}</span>
        {propTypes.map((pt) => (
          <PropTypePill key={pt} type={pt} />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : propId ? (
          <>
            {hasVisualImage ? (
              <img
                src={propImageUrl}
                alt={propName ?? ""}
                className="bg-base-300 size-12 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="bg-base-300 flex size-12 shrink-0 items-center justify-center rounded">
                {fallbackIcon}
              </div>
            )}
            <span className="text-sm">{propName}</span>
            {propTypes.map((pt) => (
              <PropTypePill key={pt} type={pt} />
            ))}
          </>
        ) : (
          <span className="btn btn-sm btn-outline btn-info font-display w-full justify-start">
            {placeholder}
          </span>
        )}
      </button>

      {open && (
        <div className="bg-base-200 border-base-300 absolute top-full left-0 z-50 mt-1 flex max-h-72 w-64 flex-col rounded-lg border shadow-xl">
          {/* Search */}
          <div className="border-base-300 shrink-0 border-b p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("prop.searchPlaceholder")}
              className="input input-sm w-full"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-base-content/40 px-3 py-3 text-xs">
                {search ? t("prop.noMatches") : t("prop.noPropsAvailable")}
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
                    "hover:bg-base-300/50 flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
                    p.id === propId && "bg-base-300",
                  )}
                >
                  {p.imageUrl && p.type !== "sound" && p.type !== "rive" ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="bg-base-300 size-8 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-base-300 flex size-8 shrink-0 items-center justify-center rounded">
                      {fallbackIcon}
                    </div>
                  )}
                  <span className="flex-1 truncate text-left">{p.name}</span>
                  <PropTypePill type={p.type} />
                </button>
              ))
            )}
          </div>

          {propId && (
            <>
              <div className="border-base-300 shrink-0 border-t" />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAssign(null);
                  close();
                }}
                className="btn btn-xs btn-primary m-3 self-end"
              >
                {t("prop.unassign")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
