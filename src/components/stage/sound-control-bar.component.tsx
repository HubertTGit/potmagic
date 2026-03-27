import { Music, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/hooks/useLanguage';
import { useStage } from './stage.context';

export function SoundControlBar() {
  const { soundName, playing, volume, setPlaying, setVolume } = useStage();
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-lg px-3 py-1.5">
      <Music className="size-4 text-base-content/50 shrink-0" />
      <span className="text-xs text-base-content/70 font-display tracking-wide max-w-[120px] truncate">
        {soundName}
      </span>
      <button
        className={cn('btn btn-ghost btn-xs btn-circle', playing && 'text-primary')}
        onClick={() => setPlaying(!playing)}
        title={playing ? t('sound.pause') : t('sound.play')}
      >
        {playing ? (
          <Pause className="size-4" />
        ) : (
          <Play className="size-4" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="range range-xs w-20"
        title={t('sound.volume')}
      />
    </div>
  );
}
