import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/hooks/useLanguage";
import type { LibraryItem } from "./library-section.component";

export interface LibraryItemOverlayProps {
  item: LibraryItem;
  confirmDeleteId: string | null;
  deletingId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onTriggerDelete: (id: string) => void;
}

export function LibraryItemOverlay({
  item,
  confirmDeleteId,
  deletingId,
  onConfirmDelete,
  onCancelDelete,
  onTriggerDelete,
}: LibraryItemOverlayProps) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "bg-base-100/70 absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 transition-opacity",
        confirmDeleteId === item.id
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100",
      )}
    >
      {confirmDeleteId === item.id ? (
        <>
          <span className="text-error mb-1 text-center text-xs leading-tight font-medium">
            {t("library.deleteConfirm")}
          </span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelDelete();
                onConfirmDelete(item.id);
              }}
              disabled={!!deletingId}
              className="btn btn-xs btn-error"
            >
              {t("action.delete")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelDelete();
              }}
              disabled={!!deletingId}
              className="btn btn-xs btn-ghost"
            >
              {t("action.cancel")}
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="line-clamp-2 text-center text-xs leading-tight font-medium">
            {item.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTriggerDelete(item.id);
            }}
            disabled={!!deletingId}
            className="text-error/70 hover:text-error transition-colors disabled:opacity-50"
          >
            <X className="size-4 rounded-full bg-white" />
          </button>
        </>
      )}
    </div>
  );
}
