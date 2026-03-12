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

const STAGE_WIDTH = 1024;
const STAGE_HEIGHT = 768;

export function StageComponent({ casts, room }: StageComponentProps) {
  return (
    <div className="w-5xl h-192">
      <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
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
