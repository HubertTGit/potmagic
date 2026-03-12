import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type { Room } from 'livekit-client';
import { DraggableCharacter } from '@/components/draggable-character.component';

export interface StageCast {
  sceneCastId: string;
  castId: string;
  userId: string;
  path: string | null;
  type: 'character' | 'background' | null;
  posX: number | null;
  posY: number | null;
  rotation: number | null;
  scaleX: number | null;
}

interface StageComponentProps {
  casts: StageCast[];
  room?: Room | null;
}

export function StageComponent({ casts, room }: StageComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen">
      <Stage width={size.width} height={size.height}>
        <Layer>
          {casts.map((cast, i) => {
            if (!cast.path || !cast.type) return null;
            return (
              <DraggableCharacter
                key={cast.sceneCastId}
                sceneCastId={cast.sceneCastId}
                castId={cast.castId}
                src={cast.path}
                userId={cast.userId}
                type={cast.type}
                initialX={cast.posX ?? 100 + i * 200}
                initialY={cast.posY ?? 100}
                initialRotation={cast.rotation ?? 0}
                initialScaleX={cast.scaleX ?? 1}
                room={room}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
