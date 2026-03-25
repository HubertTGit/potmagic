import { PropPicker } from "@/components/prop-picker";
import { Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";

export type BackgroundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: "background";
};

interface SceneBackgroundSectionProps {
  isDirector: boolean;
  background: BackgroundProp | null;
  availableBackgrounds: BackgroundProp[];
  onAssignBackground: (bg: BackgroundProp | null) => void;
  isAssigning?: boolean;
}

export function SceneBackgroundSection({
  isDirector,
  background,
  availableBackgrounds,
  onAssignBackground,
  isAssigning,
}: SceneBackgroundSectionProps) {
  const { t } = useLanguage();
  const picker =
    (isDirector && availableBackgrounds.length > 0) || background ? (
      <PropPicker
        isLoading={isAssigning}
        propId={background?.id ?? null}
        propName={background?.name ?? null}
        propImageUrl={background?.imageUrl ?? null}
        propType={background ? "background" : null}
        availableProps={availableBackgrounds}
        placeholder={background ? "Change background…" : "Assign background…"}
        readOnly={!isDirector}
        onAssign={(propId) => {
          const bg = propId
            ? (availableBackgrounds.find((b) => b.id === propId) ?? null)
            : null;
          onAssignBackground(bg);
        }}
      />
    ) : null;

  return (
    <div className="mb-8">
      <h2 className="text-base-content/40 mb-3 text-xs font-semibold tracking-widest uppercase">
        Background
      </h2>

      <div className="bg-base-200 border-base-300 flex items-center justify-between rounded-lg border px-4 py-3">
        {picker ?? (
          <span className="text-base-content/40 text-sm">
            No background in{" "}
            <Link to={'/director' as any} className="text-primary hover:underline">
              library
            </Link>{" "}
            to assigned yet.
          </span>
        )}

        {isDirector && background && (
          <button
            onClick={() => onAssignBackground(null)}
            className="text-error/60 hover:text-error hover:bg-error/10 flex items-center gap-1 rounded-lg p-2 text-xs transition-colors"
            title="Remove background"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
