import React, { useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import type { Room } from 'livekit-client';

// Force 1:1 pixel ratio — prevents Konva from doubling canvas dimensions on HiDPI screens
Konva.pixelRatio = 1;
import { DraggableCharacter } from '@/components/draggable-character.component';
import type { PropType } from '@/db/schema';

export interface StageCast {
  sceneCastId: string;
  castId: string;
  userId: string;
  path: string | null;
  type: PropType | null;
  posX: number | null;
  posY: number | null;
  rotation: number | null;
  scaleX: number | null;
}

interface StageComponentProps {
  casts: StageCast[];
  room?: Room | null;
  speakingIds?: Set<string>;
  stageWidth?: number;
  stageHeight?: number;
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

export const StageComponent = React.forwardRef<Konva.Stage, StageComponentProps>(
  function StageComponent(
    {
      casts,
      room,
      speakingIds = new Set(),
      stageWidth = STAGE_WIDTH,
      stageHeight = STAGE_HEIGHT,
    },
    ref,
  ) {
    const [allLoaded, setAllLoaded] = useState(false);

    useEffect(() => {
      const paths = casts.map((c) => c.path).filter(Boolean) as string[];
      if (paths.length === 0) {
        setAllLoaded(true);
        return;
      }
      let remaining = paths.length;
      paths.forEach((src) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = img.onerror = () => {
          remaining -= 1;
          if (remaining === 0) setAllLoaded(true);
        };
        img.src = src;
      });
    }, [casts]);

    // Sort casts so backgrounds are rendered first (bottom of stack)
    const sortedCasts = [...casts].sort((a, b) => {
      if (a.type === 'background' && b.type !== 'background') return -1;
      if (a.type !== 'background' && b.type === 'background') return 1;
      return 0;
    });

    return (
      <div className="relative w-7xl h-[720px] overflow-hidden">
        {!allLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-200">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        )}
        <Stage ref={ref} width={stageWidth} height={stageHeight}>
          <Layer>
            {sortedCasts.map((cast, i) => {
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
                  isSpeaking={speakingIds.has(cast.userId)}
                  stageWidth={stageWidth}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    );
  },
);
