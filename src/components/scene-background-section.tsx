import { PropPicker } from "@/components/prop-picker";
import { Trash2 } from "lucide-react";
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
  backgroundRepeat: boolean;
  onToggleRepeat: (repeat: boolean) => void;
}

export function SceneBackgroundSection({
  isDirector,
  background,
  availableBackgrounds,
  onAssignBackground,
  isAssigning,
  backgroundRepeat,
  onToggleRepeat,
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
        placeholder={background ? t('scene.changeBackground') : t('scene.assignBackground')}
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
        {t('scene.background')}
      </h2>

      <div className="bg-base-200 border-base-300 flex items-center justify-between rounded-lg border px-4 py-3">
        {picker ?? (
          <span className="text-base-content/40 text-sm">
            {t('scene.noBackgroundInLibrary')}
          </span>
        )}

        {isDirector && background && (
          <div className="flex shrink-0 items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <span className="text-base-content/50 text-xs">{t('scene.repeat')}</span>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-success"
                checked={backgroundRepeat}
                onChange={(e) => onToggleRepeat(e.target.checked)}
              />
            </label>
            <button
              onClick={() => onAssignBackground(null)}
              className="text-error/60 hover:text-error hover:bg-error/10 flex items-center gap-1 rounded-lg p-2 text-xs transition-colors"
              title={t('aria.removeBackground')}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
