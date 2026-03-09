import { useEffect, useRef } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { useWindowSize } from '../hooks/useWindowSize'
import { DraggableImage } from './draggable-image.component'

interface StageComponentProps {
  images: string[]
}

export function StageComponent({ images }: StageComponentProps) {
  const { width, height } = useWindowSize()
  const selectedNodeRef = useRef<Konva.Image | null>(null)
  const selectedClickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleImageSelect = (node: Konva.Image, clickLocal: { x: number; y: number }) => {
    selectedNodeRef.current = node
    selectedClickRef.current = clickLocal
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      const node = selectedNodeRef.current
      const clickLocal = selectedClickRef.current
      if (!node) return

      const transform = node.getAbsoluteTransform()
      const pivotAbs = transform.point(clickLocal)

      node.offsetX(clickLocal.x)
      node.offsetY(clickLocal.y)
      node.absolutePosition(pivotAbs)
      node.scaleX(node.scaleX() * -1)

      node.getLayer()?.batchDraw()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Stage width={width} height={height}>
      <Layer>
        {images.map((src, i) => (
          <DraggableImage
            key={src}
            src={src}
            initialX={100 + i * 200}
            initialY={100}
            onSelect={handleImageSelect}
          />
        ))}
      </Layer>
    </Stage>
  )
}
