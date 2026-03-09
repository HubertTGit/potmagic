import { Stage, Layer } from 'react-konva'
import { useWindowSize } from '../hooks/useWindowSize'
import { DraggableImage } from './draggable-image.component'

interface StageComponentProps {
  images: string[]
}

export function StageComponent({ images }: StageComponentProps) {
  const { width, height } = useWindowSize()

  return (
    <Stage width={width} height={height}>
      <Layer>
        {images.map((src, i) => (
          <DraggableImage
            key={src}
            src={src}
            initialX={100 + i * 200}
            initialY={100}
          />
        ))}
      </Layer>
    </Stage>
  )
}
