import { Stage, Layer } from 'react-konva'
import { useWindowSize } from '../hooks/useWindowSize'

export function StageComponent() {
  const { width, height } = useWindowSize()

  return (
    <Stage width={width} height={height}>
      <Layer />
    </Stage>
  )
}
