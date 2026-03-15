import * as RiveModule from '@rive-app/react-webgl2';
import { cn } from '@/lib/cn';

// Safely resolve Rive exports for SSR and CJS compatibility
const getRive = () => {
  if (typeof window === 'undefined') return {};
  return (RiveModule as any).default || RiveModule;
};

const Rive = getRive();
const useRive = Rive.useRive;
const Layout = Rive.Layout;
const Fit = Rive.Fit;

export function RiveCanvas({
  src,
  buffer,
  className,
}: {
  src?: string;
  buffer?: ArrayBuffer;
  className?: string;
}) {
  const isCover = className?.includes('object-cover');
  const fit = isCover ? Fit?.Cover || 'cover' : Fit?.Contain || 'contain';

  if (typeof window === 'undefined' || !useRive) {
    return <div className={className} />;
  }

  const { RiveComponent } = useRive({
    src,
    buffer,
    stateMachines: 'State Machine 1',
    layout: Layout
      ? new Layout({
          fit: fit,
        })
      : undefined,
    autoplay: true,
  });

  return (
    <div className={cn(className, 'overflow-hidden')}>
      <RiveComponent className="w-full h-full" />
    </div>
  );
}
