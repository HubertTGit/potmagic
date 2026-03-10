import { Stage, Layer } from 'react-konva'
import { useWindowSize } from '@/hooks/useWindowSize'
import { DraggableCharacter } from '@/components/draggable-character.component'

interface StageComponentProps {
  casts: { userId: string; path: string }[]
}

export function StageComponent({ casts }: StageComponentProps) {
  const { width, height } = useWindowSize()

  return (
    <Stage width={width} height={height}>
      <Layer>
        {casts.map((cast, i) => (
          <DraggableCharacter
            key={cast.userId}
            src={cast.path}
            initialX={100 + i * 200}
            initialY={100}
          />
        ))}
      </Layer>
    </Stage>
  )
}
