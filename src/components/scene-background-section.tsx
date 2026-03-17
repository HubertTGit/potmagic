import { PropPicker } from './prop-picker';
import { TrashIcon } from '@heroicons/react/24/outline';

export type BackgroundProp = {
  id: string;
  name: string;
  imageUrl: string | null;
  type: 'background';
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
  const picker = (isDirector && availableBackgrounds.length > 0) || background ? (
    <PropPicker
      isLoading={isAssigning}
      propId={background?.id ?? null}
      propName={background?.name ?? null}
      propImageUrl={background?.imageUrl ?? null}
      propType={background ? 'background' : null}
      availableProps={availableBackgrounds}
      placeholder={background ? 'Change background…' : 'Assign background…'}
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
      <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
        Background
      </h2>

      <div className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300">
        {picker}

        {isDirector && background && (
          <button
            onClick={() => onAssignBackground(null)}
            className="text-xs text-error/60 hover:text-error transition-colors flex items-center gap-1 p-2 hover:bg-error/10 rounded-lg"
            title="Remove background"
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
