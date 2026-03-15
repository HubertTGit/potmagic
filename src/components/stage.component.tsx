import { Stage, Layer } from 'react-konva';
import type { Room } from 'livekit-client';
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
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

export function StageComponent({
  casts,
  room,
  speakingIds = new Set(),
}: StageComponentProps) {
  // Sort casts so backgrounds are rendered first (bottom of stack)
  const sortedCasts = [...casts].sort((a, b) => {
    if (a.type === 'background' && b.type !== 'background') return -1;
    if (a.type !== 'background' && b.type === 'background') return 1;
    return 0;
  });

  return (
    <div className="w-5xl h-192">
      <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT}>
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
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
