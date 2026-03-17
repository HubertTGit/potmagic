import { MusicalNoteIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/cn';

interface SoundControlBarProps {
  soundName: string;
  playing: boolean;
  volume: number;
  onTogglePlay: () => void;
  onVolumeChange: (v: number) => void;
}

export function SoundControlBar({
  soundName,
  playing,
  volume,
  onTogglePlay,
  onVolumeChange,
}: SoundControlBarProps) {
  return (
    <div className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-lg px-3 py-1.5">
      <MusicalNoteIcon className="size-4 text-base-content/50 shrink-0" />
      <span className="text-xs text-base-content/70 font-display tracking-wide max-w-[120px] truncate">
        {soundName}
      </span>
      <button
        className={cn('btn btn-ghost btn-xs btn-circle', playing && 'text-primary')}
        onClick={onTogglePlay}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <PauseIcon className="size-4" />
        ) : (
          <PlayIcon className="size-4" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="range range-xs w-20"
        title="Volume"
      />
    </div>
  );
}
