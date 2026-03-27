import { Trash2, Music } from "lucide-react";
import { PropPicker } from "@/components/prop-picker";
import { useLanguage } from "@/hooks/useLanguage";

export type SoundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: "sound";
};

interface SceneSoundSectionProps {
  isDirector: boolean;
  sound: SoundProp | null;
  availableSounds: SoundProp[];
  onAssignSound: (sound: SoundProp | null) => void;
  isAssigning: boolean;
  autoplay: boolean;
  onToggleAutoplay: (autoplay: boolean) => void;
  isTogglingAutoplay?: boolean;
}

const soundIcon = <Music className="text-base-content/40 size-4" />;

export function SceneSoundSection({
  isDirector,
  sound,
  availableSounds,
  onAssignSound,
  isAssigning,
  autoplay,
  onToggleAutoplay,
  isTogglingAutoplay,
}: SceneSoundSectionProps) {
  const { t } = useLanguage();
  const picker =
    (isDirector && availableSounds.length > 0) || sound ? (
      <PropPicker
        isLoading={isAssigning}
        propId={sound?.id ?? null}
        propName={sound?.name ?? null}
        propImageUrl={null}
        propType={sound ? "sound" : null}
        availableProps={availableSounds}
        placeholder={sound ? t('scene.changeSound') : t('scene.assignSound')}
        fallbackIcon={soundIcon}
        readOnly={!isDirector}
        onAssign={(propId) => {
          const s = propId
            ? (availableSounds.find((s) => s.id === propId) ?? null)
            : null;
          onAssignSound(s);
        }}
      />
    ) : null;

  return (
    <div className="mb-8">
      <h2 className="text-base-content/40 mb-3 text-xs font-semibold tracking-widest uppercase">
        {t('scene.sound')}
      </h2>

      <div className="bg-base-200 border-base-300 flex items-center justify-between rounded-lg border px-4 py-3">
        {picker ?? (
          <span className="text-base-content/40 text-sm">
            {t('scene.noSoundInLibrary')}
          </span>
        )}

        {isDirector && sound && (
          <div className="flex shrink-0 items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <span className="text-base-content/50 text-xs">{t('scene.autoplay')}</span>
              {isTogglingAutoplay ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-success"
                  checked={autoplay}
                  onChange={(e) => onToggleAutoplay(e.target.checked)}
                />
              )}
            </label>
            <button
              onClick={() => onAssignSound(null)}
              disabled={isAssigning}
              className="text-error/60 hover:text-error hover:bg-error/10 flex items-center gap-1 rounded-lg p-2 text-xs transition-colors"
              title={t('aria.removeSound')}
            >
              {isAssigning && (
                <span className="loading loading-spinner loading-xs" />
              )}
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
