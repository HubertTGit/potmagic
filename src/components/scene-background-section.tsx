import { PropTypePill } from './prop-type-pill';
import { PropPicker } from './prop-picker';

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
}

export function SceneBackgroundSection({
  isDirector,
  background,
  availableBackgrounds,
  onAssignBackground,
}: SceneBackgroundSectionProps) {
  const picker = isDirector && availableBackgrounds.length > 0 && (
    <PropPicker
      propId={background?.id ?? null}
      propName={background?.name ?? null}
      propImageUrl={background?.imageUrl ?? null}
      propType={background ? 'background' : null}
      availableProps={availableBackgrounds}
      placeholder={background ? 'Change background…' : 'Assign background…'}
      onAssign={(propId) => {
        const bg = propId
          ? (availableBackgrounds.find((b) => b.id === propId) ?? null)
          : null;
        onAssignBackground(bg);
      }}
    />
  );

  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-3">
        Background
      </h2>

      {!background ? (
        <div className="py-2">
          {picker || (
            <p className="text-base-content/30 text-sm italic">
              No background assigned.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-base-200 rounded-lg px-4 py-3 border border-base-300">
          {picker}
        </div>
      )}
    </div>
  );
}
