// @rive-app/react-webgl2 is a CJS module; destructure from the default export to avoid
// Vite's "named export not found" error when the package is pre-bundled.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import pkg from '@rive-app/react-webgl2';
const { useRive, Layout, Fit } = pkg as any;
import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

function RivePlayer({
  src,
  buffer,
  artboard,
  className,
}: {
  src?: string;
  buffer?: ArrayBuffer;
  artboard?: string;
  className?: string;
}) {
  const isCover = className?.includes('object-cover');
  const fit = isCover ? Fit.Cover : Fit.Contain;

  const { RiveComponent } = useRive({
    src,
    buffer,
    artboard: artboard ?? 'potmagicArtboard',
    stateMachines: 'potmagicStateMachine',
    layout: new Layout({ fit }),
    autoplay: true,
  });

  return (
    <div className={cn(className, 'overflow-hidden')}>
      <RiveComponent className="w-full h-full" />
    </div>
  );
}

export function RiveCanvas({
  src,
  buffer,
  artboard,
  className,
}: {
  src?: string;
  buffer?: ArrayBuffer;
  artboard?: string;
  className?: string;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className={className} />;
  }

  return <RivePlayer src={src} buffer={buffer} artboard={artboard} className={className} />;
}
