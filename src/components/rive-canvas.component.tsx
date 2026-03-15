import { useRive, Layout, Fit } from '@rive-app/react-webgl2';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

function RivePlayer({
  src,
  buffer,
  className,
}: {
  src?: string;
  buffer?: ArrayBuffer;
  className?: string;
}) {
  const isCover = className?.includes('object-cover');
  const fit = isCover ? Fit.Cover : Fit.Contain;

  const { RiveComponent } = useRive({
    src,
    buffer,
    stateMachines: 'State Machine 1',
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
  className,
}: {
  src?: string;
  buffer?: ArrayBuffer;
  className?: string;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className={className} />;
  }

  return <RivePlayer src={src} buffer={buffer} className={className} />;
}
