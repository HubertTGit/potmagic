import { Trash2, Music } from 'lucide-react';
import { PropPicker } from '@/components/prop-picker';

export type SoundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: 'sound';
};

interface SceneSoundSectionProps {
  isDirector: boolean;
  sound: SoundProp | null;
  availableSounds: SoundProp[];
  onAssignSound: (sound: SoundProp | null) => void;
  isAssigning: boolean;
  autoplay: boolean;
  onToggleAutoplay: (autoplay: boolean) => void;
}

const soundIcon = <Music className="size-4 text-base-content/40" />;

export function SceneSoundSection({
  isDirector,
  sound,
  availableSounds,
  onAssignSound,
  isAssigning,
  autoplay,
  onToggleAutoplay,
}: SceneSoundSectionProps) {
  const picker = (isDirector && availableSounds.length > 0) || sound ? (
    <PropPicker
      isLoading={isAssigning}
      propId={sound?.id ?? null}
      propName={sound?.name ?? null}
      propImageUrl={null}
      propType={sound ? 'sound' : null}
      availableProps={availableSounds}
      placeholder={sound ? 'Change sound…' : 'Assign sound…'}
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
      <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
        Sound
      </h2>

      <div className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300">
        {picker}

        {isDirector && sound && (
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-base-content/50">Autoplay</span>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-success"
                checked={autoplay}
                onChange={(e) => onToggleAutoplay(e.target.checked)}
              />
            </label>
            <button
              onClick={() => onAssignSound(null)}
              disabled={isAssigning}
              className="text-xs text-error/60 hover:text-error transition-colors flex items-center gap-1 p-2 hover:bg-error/10 rounded-lg"
              title="Remove sound"
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
